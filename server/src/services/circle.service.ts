import crypto from 'crypto';
import { circleRepository } from '../repositories/circle.repository';
import { memberRepository } from '../repositories/member.repository';
import { userRepository } from '../repositories/user.repository';
import { CareCircle, CircleMember, Role, Permission, MemberStatus } from '../types';
import { AppError } from '../middleware/errorHandler';

export class CircleService {
  async createCircle(elderUid: string, name: string): Promise<CareCircle> {
    const circleId = crypto.randomUUID();
    const now = new Date().toISOString();

    const circle: CareCircle = {
      id: circleId,
      elderUid,
      name,
      createdAt: now,
    };

    await circleRepository.create(circle);

    const elderMember: CircleMember = {
      uid: elderUid,
      circleId,
      role: 'ELDER',
      status: 'active',
      permissions: ['manage_medicines', 'manage_appointments'],
      joinedAt: now,
    };

    await memberRepository.saveMember(elderMember);

    return circle;
  }

  async getCircleDetails(
    circleId: string,
    uid: string
  ): Promise<{ circle: CareCircle; membership: CircleMember }> {
    const circle = await circleRepository.findById(circleId);
    if (!circle) {
      throw new AppError('Care Circle not found', 404, 'NOT_FOUND');
    }

    const membership = await memberRepository.findMember(circleId, uid);
    if (!membership || membership.status !== 'active') {
      throw new AppError('Access denied. Not an active member of this circle.', 403, 'FORBIDDEN');
    }

    return { circle, membership };
  }

  async listMembers(circleId: string): Promise<CircleMember[]> {
    const members = await memberRepository.listMembers(circleId);

    // Enrich with user names and emails for clean UI display
    const enriched: CircleMember[] = [];
    for (const member of members) {
      const user = await userRepository.findById(member.uid);
      enriched.push({
        ...member,
        name: user?.name || 'Member',
        email: user?.email || '',
      });
    }

    return enriched;
  }

  async updateMember(
    circleId: string,
    elderUid: string,
    targetUid: string,
    update: {
      role?: Role;
      permissions?: Permission[];
      status?: MemberStatus;
    }
  ): Promise<CircleMember> {
    const member = await memberRepository.findMember(circleId, targetUid);
    if (!member) {
      throw new AppError('Member not found in this circle', 404, 'NOT_FOUND');
    }

    // Elder cannot revoke or demote themselves
    if (targetUid === elderUid && update.status === 'revoked') {
      throw new AppError('The Elder cannot revoke their own membership', 400, 'BAD_REQUEST');
    }

    const updatedData: Partial<CircleMember> = {};
    if (update.role) updatedData.role = update.role;
    if (update.permissions) updatedData.permissions = update.permissions;
    if (update.status) updatedData.status = update.status;

    await memberRepository.updateMember(circleId, targetUid, updatedData);

    const updatedMember = await memberRepository.findMember(circleId, targetUid);
    return updatedMember!;
  }

  async revokeMember(circleId: string, elderUid: string, targetUid: string): Promise<void> {
    if (elderUid === targetUid) {
      throw new AppError('The Elder cannot revoke their own membership', 400, 'BAD_REQUEST');
    }

    const member = await memberRepository.findMember(circleId, targetUid);
    if (!member) {
      throw new AppError('Member not found', 404, 'NOT_FOUND');
    }

    await memberRepository.updateMember(circleId, targetUid, { status: 'revoked' });
  }
}

export const circleService = new CircleService();
