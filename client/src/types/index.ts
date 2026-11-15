export type Role = 'ELDER' | 'FAMILY' | 'CAREGIVER';

export type Permission = 'view_only' | 'manage_medicines' | 'manage_appointments';

export type MemberStatus = 'pending' | 'active' | 'revoked';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  timezone: string;
  language: 'en' | 'hi';
  seniorMode: boolean;
  fcmTokens: string[];
  createdAt: string;
}

export interface CareCircle {
  id: string;
  elderUid: string;
  name: string;
  createdAt: string;
  role?: Role;
  status?: MemberStatus;
}

export interface CircleMember {
  uid: string;
  circleId: string;
  role: Role;
  status: MemberStatus;
  permissions: Permission[];
  joinedAt: string;
  name?: string;
  email?: string;
}

export interface InviteResult {
  code: string;
  expiresAt: string;
}
