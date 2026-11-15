export type Role = 'ELDER' | 'FAMILY' | 'CAREGIVER';

export type Permission = 'view_only' | 'manage_medicines' | 'manage_appointments';

export type MemberStatus = 'pending' | 'active' | 'revoked';

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped';

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

export interface MedicineSchedule {
  times: string[];
  daysOfWeek: number[];
  startDate: string;
  endDate?: string;
}

export interface Medicine {
  id: string;
  circleId: string;
  name: string;
  dosage: string;
  form: string;
  schedule: MedicineSchedule;
  asNeeded: boolean;
  quantityRemaining: number;
  refillThresholdDays: number;
  lastRefillAlertLevel: 0 | 7 | 3 | 1;
  notes?: string;
  active: boolean;
  dosesPerDay?: number;
  daysLeft?: number | null;
  runOutDate?: string | null;
  alertLevel?: 0 | 7 | 3 | 1;
}

export interface DoseLog {
  id: string;
  circleId: string;
  medicineId: string;
  scheduledAt: string;
  status: DoseStatus;
  loggedAt: string | null;
  loggedBy: string | null;
  escalationStep: number;
  medicineName?: string;
  dosage?: string;
  form?: string;
  notes?: string;
}

export interface ProposedChange {
  id: string;
  circleId: string;
  type: 'create' | 'update' | 'delete';
  targetId?: string;
  payload: Record<string, unknown>;
  proposedBy: string;
  proposerName?: string;
  proposerEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt: string | null;
}

export interface AdherenceMetrics {
  sevenDayPercentage: number;
  thirtyDayPercentage: number;
  currentStreak: number;
  totalScheduled30d: number;
  totalTaken30d: number;
  totalSkipped30d: number;
  totalMissed30d: number;
  dailyBreakdown: Array<{
    date: string;
    total: number;
    taken: number;
    missed: number;
    skipped: number;
    percentage: number;
  }>;
  medicineBreakdown: Array<{
    medicineId: string;
    medicineName?: string;
    total: number;
    taken: number;
    percentage: number;
  }>;
}
