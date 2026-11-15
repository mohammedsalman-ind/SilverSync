import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { circleRepository } from '../../repositories/circle.repository';
import { memberRepository } from '../../repositories/member.repository';
import { inviteRepository } from '../../repositories/invite.repository';
import { userRepository } from '../../repositories/user.repository';
import { hashInviteCode } from '../../utils/crypto';

describe('API Integration Tests (Phase 1 Scaffolding & Endpoints)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /healthz', () => {
    it('should return 200 OK with health status and service name', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('silversync-backend');
      expect(res.body.uptime).toBeDefined();
    });
  });

  describe('404 Route Handler', () => {
    it('should return standardized 404 error for non-existent routes', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Authentication & Protected Routes', () => {
    it('should reject unauthenticated requests to /api/v1/auth/me with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated requests to create circles with 401', async () => {
      const res = await request(app)
        .post('/api/v1/circles')
        .send({ name: 'Grandma Care' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Zod Validation Middleware', () => {
    it('should return 422 VALIDATION_ERROR when circle name is too short', async () => {
      const res = await request(app)
        .post('/api/v1/circles')
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({ name: 'A' }); // minimum is 2 characters

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 VALIDATION_ERROR when redeeming invite code with invalid length', async () => {
      const res = await request(app)
        .post('/api/v1/invites/redeem')
        .set('Authorization', 'Bearer mock-token-family1')
        .send({ code: '123' }); // min length is 6

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Care Circle Creation & Member Management', () => {
    it('should create a new circle and assign user as active ELDER', async () => {
      vi.spyOn(circleRepository, 'create').mockResolvedValue(undefined);
      vi.spyOn(memberRepository, 'saveMember').mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/circles')
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({ name: 'Shanti Devi Care' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Shanti Devi Care');
      expect(res.body.data.elderUid).toBe('elder1');
    });

    it('should generate an 8-character invite code when elder invites someone', async () => {
      const circleId = 'test-circle-123';
      vi.spyOn(circleRepository, 'findById').mockResolvedValue({
        id: circleId,
        elderUid: 'elder1',
        name: 'Shanti Devi Care',
        createdAt: new Date().toISOString(),
      });
      vi.spyOn(memberRepository, 'findMember').mockResolvedValue({
        uid: 'elder1',
        circleId,
        role: 'ELDER',
        status: 'active',
        permissions: ['manage_medicines', 'manage_appointments'],
        joinedAt: new Date().toISOString(),
      });
      vi.spyOn(inviteRepository, 'createInvite').mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/circles/${circleId}/invites`)
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toHaveLength(8);
      expect(res.body.data.expiresAt).toBeDefined();
    });

    it('should allow invitee to redeem code and enter pending membership state', async () => {
      const circleId = 'test-circle-123';
      const code = 'TESTCODE';
      const codeHash = hashInviteCode(code);

      vi.spyOn(inviteRepository, 'findInviteByHash').mockResolvedValue({
        id: 'invite-1',
        circleId,
        codeHash,
        createdBy: 'elder1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        usedAt: null,
        usedBy: null,
      });
      vi.spyOn(circleRepository, 'findById').mockResolvedValue({
        id: circleId,
        elderUid: 'elder1',
        name: 'Shanti Devi Care',
        createdAt: new Date().toISOString(),
      });
      vi.spyOn(memberRepository, 'findMember').mockResolvedValue(null);
      vi.spyOn(inviteRepository, 'markInviteUsed').mockResolvedValue(undefined);
      vi.spyOn(memberRepository, 'saveMember').mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/invites/redeem')
        .set('Authorization', 'Bearer mock-token-family1')
        .send({ code });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.circleName).toBe('Shanti Devi Care');
    });

    it('should reject already used invite code with 400', async () => {
      const code = 'USEDDONE';
      const codeHash = hashInviteCode(code);

      vi.spyOn(inviteRepository, 'findInviteByHash').mockResolvedValue({
        id: 'invite-2',
        circleId: 'circle-1',
        codeHash,
        createdBy: 'elder1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        usedAt: new Date().toISOString(), // already used
        usedBy: 'someone-else',
      });

      const res = await request(app)
        .post('/api/v1/invites/redeem')
        .set('Authorization', 'Bearer mock-token-family1')
        .send({ code });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVITE_ALREADY_USED');
    });
  });

  describe('Elder Member Approval and Revocation', () => {
    const circleId = 'circle-1';

    it('should allow Elder to approve pending member and assign permissions', async () => {
      vi.spyOn(memberRepository, 'findMember')
        .mockResolvedValueOnce({
          // for requireCircleMember check on caller (elder)
          uid: 'elder1',
          circleId,
          role: 'ELDER',
          status: 'active',
          permissions: ['manage_medicines', 'manage_appointments'],
          joinedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          // for target member check in service
          uid: 'family1',
          circleId,
          role: 'FAMILY',
          status: 'pending',
          permissions: ['view_only'],
          joinedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          // for fetching updated target member
          uid: 'family1',
          circleId,
          role: 'FAMILY',
          status: 'active',
          permissions: ['manage_medicines'],
          joinedAt: new Date().toISOString(),
        });

      vi.spyOn(memberRepository, 'updateMember').mockResolvedValue(undefined);

      const res = await request(app)
        .patch(`/api/v1/circles/${circleId}/members/family1`)
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({
          status: 'active',
          role: 'FAMILY',
          permissions: ['manage_medicines'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
    });

    it('should reject non-elder attempts to approve or modify members with 403', async () => {
      vi.spyOn(memberRepository, 'findMember').mockResolvedValue({
        uid: 'family1',
        circleId,
        role: 'FAMILY',
        status: 'active',
        permissions: ['manage_medicines'],
        joinedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .patch(`/api/v1/circles/${circleId}/members/caregiver1`)
        .set('Authorization', 'Bearer mock-token-family1')
        .send({ status: 'active' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PERMISSION_DENIED');
    });

    it('should prevent Elder from revoking their own membership', async () => {
      vi.spyOn(memberRepository, 'findMember').mockResolvedValue({
        uid: 'elder1',
        circleId,
        role: 'ELDER',
        status: 'active',
        permissions: ['manage_medicines', 'manage_appointments'],
        joinedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .delete(`/api/v1/circles/${circleId}/members/elder1`)
        .set('Authorization', 'Bearer mock-token-elder1');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Elder cannot revoke their own membership');
    });
  });

  describe('Session Sync Endpoint', () => {
    it('should sync user profile and return active circles', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(null);
      vi.spyOn(userRepository, 'upsert').mockResolvedValue({
        uid: 'elder1',
        email: 'elder1@example.com',
        name: 'Elder Person',
        timezone: 'Asia/Kolkata',
        language: 'en',
        seniorMode: true,
        fcmTokens: [],
        createdAt: new Date().toISOString(),
      });
      vi.spyOn(memberRepository, 'findMembershipsByUser').mockResolvedValue([
        {
          uid: 'elder1',
          circleId: 'circle-1',
          role: 'ELDER',
          status: 'active',
          permissions: ['manage_medicines', 'manage_appointments'],
          joinedAt: new Date().toISOString(),
        },
      ]);
      vi.spyOn(circleRepository, 'findById').mockResolvedValue({
        id: 'circle-1',
        elderUid: 'elder1',
        name: 'My Care Circle',
        createdAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/auth/session')
        .set('Authorization', 'Bearer mock-token-elder1')
        .send({
          name: 'Elder Person',
          seniorMode: true,
          language: 'en',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Elder Person');
      expect(res.body.data.circles).toHaveLength(1);
    });
  });
});
