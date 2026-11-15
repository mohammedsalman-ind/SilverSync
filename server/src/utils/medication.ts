import { MedicineSchedule, DoseLog, DoseStatus } from '../types';

/**
 * Calculates average doses taken per day derived from schedule.
 * If asNeeded is true, returns 0.
 */
export function calculateDosesPerDay(schedule: MedicineSchedule, asNeeded: boolean): number {
  if (asNeeded) {
    return 0;
  }
  const timesPerDay = schedule.times.length;
  const daysPerWeek = schedule.daysOfWeek.length;

  if (timesPerDay === 0 || daysPerWeek === 0) {
    return 0;
  }

  // e.g. 2 times per day on 7 days = 2.0
  // e.g. 1 time per day on 3 days = 3/7 = 0.428...
  return Number(((timesPerDay * daysPerWeek) / 7).toFixed(2));
}

/**
 * Calculates estimated days of medication left.
 * daysLeft = floor(quantityRemaining / dosesPerDay)
 * Returns null if asNeeded or dosesPerDay is 0.
 */
export function calculateDaysLeft(
  quantityRemaining: number,
  dosesPerDay: number
): number | null {
  if (dosesPerDay <= 0 || quantityRemaining <= 0) {
    return dosesPerDay <= 0 ? null : 0;
  }
  return Math.floor(quantityRemaining / dosesPerDay);
}

/**
 * Calculates estimated run-out date formatted as YYYY-MM-DD.
 */
export function calculateRunOutDate(
  daysLeft: number | null,
  fromDate: Date = new Date()
): string | null {
  if (daysLeft === null) {
    return null;
  }
  const targetDate = new Date(fromDate.getTime() + daysLeft * 24 * 60 * 60 * 1000);
  return targetDate.toISOString().split('T')[0];
}

/**
 * Daily alert tiers:
 * 7 days left -> gentle (7)
 * 3 days left -> urgent (3)
 * 1 day left -> critical (1)
 * Otherwise -> normal (0)
 */
export function calculateRefillAlertLevel(daysLeft: number | null): 0 | 7 | 3 | 1 {
  if (daysLeft === null || daysLeft > 7) {
    return 0;
  }
  if (daysLeft <= 1) {
    return 1;
  }
  if (daysLeft <= 3) {
    return 3;
  }
  return 7;
}

/**
 * Evaluates whether a new refill alert should be triggered.
 * Prevents duplicate alerts at the same or higher stock level.
 */
export function shouldSendRefillAlert(
  currentLevel: 0 | 7 | 3 | 1,
  lastAlertLevel: 0 | 7 | 3 | 1
): boolean {
  if (currentLevel === 0) {
    return false;
  }
  // If we already alerted at this level, do not send again
  if (currentLevel === lastAlertLevel) {
    return false;
  }
  // Alert if moving into a more urgent tier (e.g. 0 -> 7, 7 -> 3, 3 -> 1)
  if (lastAlertLevel === 0) {
    return true;
  }
  // Smaller number = more urgent (1 is more urgent than 3, 3 is more urgent than 7)
  return currentLevel < lastAlertLevel;
}

/**
 * Determines whether a dose is MISSED.
 * A dose is missed if it is not logged within 60 minutes of its scheduled time.
 */
export function isDoseMissed(
  scheduledAt: string | Date,
  currentTime: Date = new Date()
): boolean {
  const schedMs = typeof scheduledAt === 'string' ? new Date(scheduledAt).getTime() : scheduledAt.getTime();
  const diffMs = currentTime.getTime() - schedMs;
  return diffMs > 60 * 60 * 1000;
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
    total: number;
    taken: number;
    percentage: number;
  }>;
}

/**
 * Calculates 7-day and 30-day adherence, current streak, and breakdowns.
 */
export function calculateAdherence(
  doseLogs: DoseLog[],
  now: Date = new Date()
): AdherenceMetrics {
  const nowMs = now.getTime();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;

  // Filter logs up to current time within last 30 days
  const validLogs = doseLogs.filter((log) => {
    const logMs = new Date(log.scheduledAt).getTime();
    return logMs <= nowMs && logMs >= nowMs - ms30d;
  });

  let total7d = 0;
  let taken7d = 0;
  let total30d = 0;
  let taken30d = 0;
  let skipped30d = 0;
  let missed30d = 0;

  const dayMap = new Map<string, { total: number; taken: number; missed: number; skipped: number }>();
  const medMap = new Map<string, { total: number; taken: number }>();

  // Pre-populate last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    dayMap.set(dateStr, { total: 0, taken: 0, missed: 0, skipped: 0 });
  }

  for (const log of validLogs) {
    const logDate = new Date(log.scheduledAt);
    const logMs = logDate.getTime();
    const dateStr = logDate.toISOString().split('T')[0];

    // Determine effective status (auto-mark missed if past 60 min and pending)
    let effectiveStatus: DoseStatus = log.status;
    if (effectiveStatus === 'pending' && isDoseMissed(log.scheduledAt, now)) {
      effectiveStatus = 'missed';
    }

    // Skipped doses are acknowledged routines, but only 'taken' counts toward adherence percentage
    total30d++;
    if (effectiveStatus === 'taken') taken30d++;
    else if (effectiveStatus === 'missed') missed30d++;
    else if (effectiveStatus === 'skipped') skipped30d++;

    if (nowMs - logMs <= ms7d) {
      total7d++;
      if (effectiveStatus === 'taken') taken7d++;
    }

    // Day bucket
    const dayEntry = dayMap.get(dateStr) || { total: 0, taken: 0, missed: 0, skipped: 0 };
    dayEntry.total++;
    if (effectiveStatus === 'taken') dayEntry.taken++;
    else if (effectiveStatus === 'missed') dayEntry.missed++;
    else if (effectiveStatus === 'skipped') dayEntry.skipped++;
    dayMap.set(dateStr, dayEntry);

    // Medicine bucket
    const medEntry = medMap.get(log.medicineId) || { total: 0, taken: 0 };
    medEntry.total++;
    if (effectiveStatus === 'taken') medEntry.taken++;
    medMap.set(log.medicineId, medEntry);
  }

  const sevenDayPercentage = total7d > 0 ? Math.round((taken7d / total7d) * 100) : 100;
  const thirtyDayPercentage = total30d > 0 ? Math.round((taken30d / total30d) * 100) : 100;

  // Calculate current streak (consecutive days with 100% adherence ending today or yesterday)
  const sortedDates = Array.from(dayMap.keys()).sort().reverse();
  let currentStreak = 0;

  for (const date of sortedDates) {
    const day = dayMap.get(date)!;
    if (day.total === 0) {
      continue; // No doses scheduled on this day, streak not broken
    }
    if (day.taken === day.total) {
      currentStreak++;
    } else {
      break; // Missed or pending dose breaks the streak
    }
  }

  const dailyBreakdown = Array.from(dayMap.entries())
    .map(([date, val]) => ({
      date,
      total: val.total,
      taken: val.taken,
      missed: val.missed,
      skipped: val.skipped,
      percentage: val.total > 0 ? Math.round((val.taken / val.total) * 100) : 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const medicineBreakdown = Array.from(medMap.entries()).map(([medicineId, val]) => ({
    medicineId,
    total: val.total,
    taken: val.taken,
    percentage: val.total > 0 ? Math.round((val.taken / val.total) * 100) : 100,
  }));

  return {
    sevenDayPercentage,
    thirtyDayPercentage,
    currentStreak,
    totalScheduled30d: total30d,
    totalTaken30d: taken30d,
    totalSkipped30d: skipped30d,
    totalMissed30d: missed30d,
    dailyBreakdown,
    medicineBreakdown,
  };
}
