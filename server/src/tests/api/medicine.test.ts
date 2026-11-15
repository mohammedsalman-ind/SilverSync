import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { medicineRepository } from '../../repositories/medicine.repository';
import { doseLogRepository } from '../../repositories/doseLog.repository';
import { proposalRepository } from '../../repositories/proposal.repository';
import { memberRepository } from '../../repositories/member.repository';

describe('Medicine, Doses & Elder-Approval API Tests (Phase 2)', () => {
  const circleId = 'test-circle-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockElderMembership = () => {
    vi.spyOn(memberRepository, 'findMember').mockResolvedValue({
      uid: 'elder1',
      circleId,
      role: 'ELDER',
      status: 'active',
      permissions: ['manage_medicines', 'manage_appointments'],
      joinedAt: new Date().toISOString(),
    });
  };

  const mockFamilyMembership = () => {
    vi.spyOn(memberRepository, 'findMember').mockResolvedValue({
      uid: 'family1',
      circleId,
      role: 'FAMILY',
      status: 'active',
      permissions: ['manage_medicines'],
      joinedAt: new Date().toISOString(),
    });
  };

  describe('Medicine Creation: Elder Direct vs Propose Flow', () => {
    const medPayload = {
      name: 'Metformin',
      dosage: '500mg',
      form: 'Tablet',
      schedule: {
        times: ['08:00', '20:00'],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startDate: '2026-01-01',
      },
      asNeeded: false,
      quantityRemaining: 60,
      refillThresholdDays: 7,
    };

    it('Elder creates medicine directly with direct: true', async () => {
      mockElderMembership();
      vi.spyOn(medicineRepository, 'create').mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/circles/${circleId}/medicines`)
        .set('Authorization', 'Bearer mock-token-elder1')
        .send(medPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.direct).toBe(true);
      expect(res.body.data.medicine.name).toBe('Metformin');
      expect(res.body.data.medicine.quantityRemaining).toBe(60);
    });

    it('Family member with manage_medicines generates a ProposedChange requiring Elder approval', async () => {
      mockFamilyMembership();
      vi.spyOn(proposalRepository, 'create').mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/circles/${circleId}/medicines`)
        .set('Authorization', 'Bearer mock-token-family1')
        .send(medPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.direct).toBe(false);
      expect(res.body.data.proposal.status).toBe('pending');
      expect(res.body.data.proposal.type).toBe('create');
    });
  });

  describe('Elder Proposal Approval & Rejection Flow', () => {
    const proposalId = 'prop-123';

    it('Elder approves pending medicine proposal and it creates the medicine', async () => {
      vi.spyOn(proposalRepository, 'findById').mockResolvedValue({
        id: proposalId,
        circleId,
        type: 'create',
        payload: {
          name: 'Amlodipine',
          dosage: '5mg',
          form: 'Tablet',
          schedule: {
            times: ['09:00'],
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startDate: '2026-01-01',
          },
          asNeeded: false,
          quantityRemaining: 30,
          refillThresholdDays: 7,
        },
        proposedBy: 'family1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        decidedAt: null,
      });

      vi.spyOn(medicineRepository, 'create').mockResolvedValue(undefined);
      vi.spyOn(proposalRepository, 'updateStatus').mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/proposals/${proposalId}/approve`)
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(medicineRepository.create).toHaveBeenCalled();
      expect(proposalRepository.updateStatus).toHaveBeenCalledWith(
        proposalId,
        'approved',
        expect.any(String)
      );
    });

    it('Elder rejects pending medicine proposal', async () => {
      vi.spyOn(proposalRepository, 'findById').mockResolvedValue({
        id: proposalId,
        circleId,
        type: 'create',
        payload: {},
        proposedBy: 'family1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        decidedAt: null,
      });

      vi.spyOn(proposalRepository, 'updateStatus').mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/proposals/${proposalId}/reject`)
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(proposalRepository.updateStatus).toHaveBeenCalledWith(
        proposalId,
        'rejected',
        expect.any(String)
      );
    });
  });

  describe('Dose Logging & Stock Decrement Rules', () => {
    const logId = 'log-1';
    const medId = 'med-1';

    it('Logging dose as TAKEN decrements stock by 1', async () => {
      vi.spyOn(doseLogRepository, 'findById').mockResolvedValue({
        id: logId,
        circleId,
        medicineId: medId,
        scheduledAt: new Date().toISOString(),
        status: 'pending',
        loggedAt: null,
        loggedBy: null,
        escalationStep: 0,
      });

      vi.spyOn(medicineRepository, 'decrementQuantity').mockResolvedValue(29);
      vi.spyOn(doseLogRepository, 'updateStatus').mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/doses/${logId}/log`)
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({ status: 'taken' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('taken');
      expect(medicineRepository.decrementQuantity).toHaveBeenCalledWith(medId, 1);
    });

    it('Logging dose as SKIPPED does NOT decrement stock', async () => {
      vi.spyOn(doseLogRepository, 'findById').mockResolvedValue({
        id: logId,
        circleId,
        medicineId: medId,
        scheduledAt: new Date().toISOString(),
        status: 'pending',
        loggedAt: null,
        loggedBy: null,
        escalationStep: 0,
      });

      vi.spyOn(medicineRepository, 'decrementQuantity').mockResolvedValue(30);
      vi.spyOn(doseLogRepository, 'updateStatus').mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/doses/${logId}/log`)
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({ status: 'skipped' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('skipped');
      expect(medicineRepository.decrementQuantity).not.toHaveBeenCalled();
    });
  });

  describe('Refill Medicine Stock', () => {
    it('Refilling stock increments quantity and resets alert level', async () => {
      const medId = 'med-1';
      vi.spyOn(medicineRepository, 'findById').mockResolvedValue({
        id: medId,
        circleId,
        name: 'Metformin',
        dosage: '500mg',
        form: 'Tablet',
        schedule: { times: ['08:00'], daysOfWeek: [0], startDate: '2026-01-01' },
        asNeeded: false,
        quantityRemaining: 2,
        refillThresholdDays: 7,
        lastRefillAlertLevel: 1,
        active: true,
      });

      vi.spyOn(medicineRepository, 'addQuantity').mockResolvedValue(32);

      const res = await request(app)
        .post(`/api/v1/medicines/${medId}/refill`)
        .set('Authorization', 'Bearer mock-token-caregiver1')
        .send({ quantity: 30 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantityRemaining).toBe(32);
      expect(medicineRepository.addQuantity).toHaveBeenCalledWith(medId, 30);
    });
  });
});
