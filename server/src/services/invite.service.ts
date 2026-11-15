import crypto from 'crypto';
import { inviteRepository } from '../repositories/invite.repository';
import { memberRepository } from '../repositories/member.repository';
import { circleRepository } from '../repositories/circle.repository';
import { generateInviteCode, hashInviteCode } from '../utils/crypto';
import { AppError } from '../middleware/errorHandler';
import { Invite, CircleMember } from '../types';

export class InviteService {
  async createInvite(
    circleId: string,
    elderUid: string
  ): Promise<{ code: string; expiresAt: string }> {
    const circle = await circleRepository.findById(circleId);
    if (!circle) {
      throw new AppError('Care Circle not found', 404, 'NOT_FOUND');
    }

    const code = generateInviteCode();
    const codeHash = hashInviteCode(code);
    const inviteId = crypto.randomUUID();

    // 24 hour expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const invite: Invite = {
      id: inviteId,
      circleId,
      codeHash,
      createdBy: elderUid,
      expiresAt,
      usedAt: null,
      usedBy: null,
    };

    await inviteRepository.createInvite(invite);

    return {
      code,
      expiresAt,
    };
  }

  async redeemInvite(
    code: string,
    inviteeUid: string
  ): Promise<{ circleId: string; status: string; circleName: string }> {
    const normalizedCode = code.trim().toUpperCase();
    const codeHash = hashInviteCode(normalizedCode);

    const invite = await inviteRepository.findInviteByHash(codeHash);

    // Generic error message to prevent enumeration or timing attacks
    if (!invite) {
      throw new AppError('Invalid or expired invite code', 400, 'INVALID_INVITE_CODE');
    }

    if (invite.usedAt) {
      throw new AppError('This invite code has already been used', 400, 'INVITE_ALREADY_USED');
    }

    const isExpired = new Date(invite.expiresAt).getTime() < Date.now();
    if (isExpired) {
      throw new AppError('This invite code has expired', 400, 'INVITE_EXPIRED');
    }

    const circle = await circleRepository.findById(invite.circleId);
    if (!circle) {
      throw new AppError('Associated Care Circle no longer exists', 404, 'NOT_FOUND');
    }

    // Check if user is already a member
    const existingMember = await memberRepository.findMember(invite.circleId, inviteeUid);
    if (existingMember && existingMember.status === 'active') {
      throw new AppError(
        'You are already an active member of this Care Circle',
        400,
        'ALREADY_MEMBER'
      );
    }

    // Mark invite as used
    await inviteRepository.markInviteUsed(invite.circleId, invite.id, inviteeUid);

    // Create pending membership
    const pendingMember: CircleMember = {
      uid: inviteeUid,
      circleId: invite.circleId,
      role: 'FAMILY',
      status: 'pending',
      permissions: ['view_only'],
      joinedAt: new Date().toISOString(),
    };

    await memberRepository.saveMember(pendingMember);

    return {
      circleId: invite.circleId,
      status: 'pending',
      circleName: circle.name,
    };
  }
}

export const inviteService = new InviteService();
