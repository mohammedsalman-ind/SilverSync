import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requirePermission, requireElder } from '../../middleware/requirePermission';
import { CircleMember } from '../../types';

describe('Role & Permission Matrix Unit Tests', () => {
  const createMockReqRes = (membership?: Partial<CircleMember>) => {
    const req = {
      membership: membership as CircleMember,
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    return { req, res, next };
  };

  describe('Elder Role (Full Authority)', () => {
    const elderMember: CircleMember = {
      uid: 'elder-1',
      circleId: 'circle-1',
      role: 'ELDER',
      status: 'active',
      permissions: ['manage_medicines', 'manage_appointments'],
      joinedAt: new Date().toISOString(),
    };

    it('should allow ELDER for requireElder middleware', () => {
      const { req, res, next } = createMockReqRes(elderMember);
      requireElder(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow ELDER for manage_medicines permission', () => {
      const { req, res, next } = createMockReqRes(elderMember);
      requirePermission('manage_medicines')(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should allow ELDER for manage_appointments permission', () => {
      const { req, res, next } = createMockReqRes(elderMember);
      requirePermission('manage_appointments')(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Family / Caregiver with view_only', () => {
    const viewOnlyMember: CircleMember = {
      uid: 'family-1',
      circleId: 'circle-1',
      role: 'FAMILY',
      status: 'active',
      permissions: ['view_only'],
      joinedAt: new Date().toISOString(),
    };

    it('should reject view_only member for requireElder', () => {
      const { req, res, next } = createMockReqRes(viewOnlyMember);
      requireElder(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject view_only member for manage_medicines', () => {
      const { req, res, next } = createMockReqRes(viewOnlyMember);
      requirePermission('manage_medicines')(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject view_only member for manage_appointments', () => {
      const { req, res, next } = createMockReqRes(viewOnlyMember);
      requirePermission('manage_appointments')(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow view_only member for view_only permission', () => {
      const { req, res, next } = createMockReqRes(viewOnlyMember);
      requirePermission('view_only')(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Family / Caregiver with manage_medicines', () => {
    const medManager: CircleMember = {
      uid: 'caregiver-1',
      circleId: 'circle-1',
      role: 'CAREGIVER',
      status: 'active',
      permissions: ['manage_medicines'],
      joinedAt: new Date().toISOString(),
    };

    it('should allow member with manage_medicines permission', () => {
      const { req, res, next } = createMockReqRes(medManager);
      requirePermission('manage_medicines')(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should reject manage_medicines member for manage_appointments', () => {
      const { req, res, next } = createMockReqRes(medManager);
      requirePermission('manage_appointments')(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject non-elder for requireElder even if they have manage_medicines', () => {
      const { req, res, next } = createMockReqRes(medManager);
      requireElder(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Missing membership context', () => {
    it('should return 403 when req.membership is undefined', () => {
      const { req, res, next } = createMockReqRes(undefined);
      requirePermission('manage_medicines')(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 for requireElder when req.membership is undefined', () => {
      const { req, res, next } = createMockReqRes(undefined);
      requireElder(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
