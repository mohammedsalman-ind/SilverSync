import { userRepository } from '../repositories/user.repository';
import { memberRepository } from '../repositories/member.repository';
import { circleRepository } from '../repositories/circle.repository';
import { UserProfile, CareCircle } from '../types';

export class AuthService {
  async syncSession(
    uid: string,
    email: string,
    data: {
      name?: string;
      timezone?: string;
      language?: 'en' | 'hi';
      seniorMode?: boolean;
      fcmToken?: string;
    }
  ): Promise<{ user: UserProfile; circles: Array<CareCircle & { role: string; status: string }> }> {
    const existing = await userRepository.findById(uid);
    let fcmTokens = existing?.fcmTokens || [];
    if (data.fcmToken && !fcmTokens.includes(data.fcmToken)) {
      fcmTokens = [...fcmTokens, data.fcmToken];
    }

    const user = await userRepository.upsert({
      uid,
      email,
      name: data.name || existing?.name,
      timezone: data.timezone || existing?.timezone,
      language: data.language || existing?.language,
      seniorMode: data.seniorMode ?? existing?.seniorMode,
      fcmTokens,
    });

    // Find all circles the user is an active or pending member of
    const memberships = await memberRepository.findMembershipsByUser(uid);
    const circlesWithMembership: Array<CareCircle & { role: string; status: string }> = [];

    for (const m of memberships) {
      if (m.status !== 'revoked') {
        const circle = await circleRepository.findById(m.circleId);
        if (circle) {
          circlesWithMembership.push({
            ...circle,
            role: m.role,
            status: m.status,
          });
        }
      }
    }

    return {
      user,
      circles: circlesWithMembership,
    };
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    return userRepository.findById(uid);
  }

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await userRepository.update(uid, data);
  }
}

export const authService = new AuthService();
