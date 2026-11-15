export type Role = 'ELDER' | 'FAMILY' | 'CAREGIVER';

export type Permission = 'view_only' | 'manage_medicines' | 'manage_appointments';

export type MemberStatus = 'pending' | 'active' | 'revoked';

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped';

export type ChangeType = 'create' | 'update' | 'delete';

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

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
}

export interface CircleMember {
  uid: string;
  circleId: string;
  role: Role;
  status: MemberStatus;
  permissions: Permission[];
  joinedAt: string;
  email?: string;
  name?: string;
}

export interface Invite {
  id: string;
  circleId: string;
  codeHash: string;
  createdBy: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
}

export interface MedicineSchedule {
  times: string[]; // HH:mm format, e.g. ["08:00", "20:00"]
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startDate: string; // YYYY-MM-DD
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
}

export interface DoseLog {
  id: string;
  circleId: string;
  medicineId: string;
  scheduledAt: string; // ISO 8601
  status: DoseStatus;
  loggedAt: string | null;
  loggedBy: string | null;
  escalationStep: number; // 0..3
}

export interface ProposedChange {
  id: string;
  circleId: string;
  type: ChangeType;
  targetId?: string;
  payload: Record<string, unknown>;
  proposedBy: string;
  status: ProposalStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface Appointment {
  id: string;
  circleId: string;
  doctorName: string;
  specialty: string;
  location: string;
  dateTime: string; // ISO 8601
  status: AppointmentStatus;
  calendarEventId?: string;
}

export interface AppointmentChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface AppointmentQuestion {
  id: string;
  text: string;
  answered: boolean;
}

export interface AppointmentNote {
  id: string;
  rawText: string;
  aiSummary?: string;
  actionItems: string[];
  sharedWith: string[]; // user UIDs permitted to view this note
  createdBy: string;
  createdAt: string;
}

export interface NotificationLog {
  dedupeKey: string;
  type: string;
  recipient: string;
  sentAt: string;
}

export interface JobLock {
  lockedUntil: string;
  owner: string;
}

export interface SosEvent {
  id: string;
  circleId: string;
  triggeredAt: string;
  recipientsNotified: string[];
}
