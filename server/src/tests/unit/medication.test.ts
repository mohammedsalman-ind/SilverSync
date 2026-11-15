import { describe, it, expect } from 'vitest';
import {
  calculateDosesPerDay,
  calculateDaysLeft,
  calculateRunOutDate,
  calculateRefillAlertLevel,
  shouldSendRefillAlert,
  isDoseMissed,
  calculateAdherence,
} from '../../utils/medication';
import { DoseLog, MedicineSchedule } from '../../types';

describe('Medication Utilities & Calculation Unit Tests', () => {
  describe('calculateDosesPerDay', () => {
    it('returns 0 if asNeeded is true', () => {
      const schedule: MedicineSchedule = {
        times: ['08:00', '20:00'],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startDate: '2026-01-01',
      };
      expect(calculateDosesPerDay(schedule, true)).toBe(0);
    });

    it('calculates doses per day for daily medicine', () => {
      const schedule: MedicineSchedule = {
        times: ['08:00', '14:00', '20:00'],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startDate: '2026-01-01',
      };
      expect(calculateDosesPerDay(schedule, false)).toBe(3);
    });

    it('calculates fractional doses per day for alternate days', () => {
      // e.g. Mon, Wed, Fri (3 days/week, 1 dose each = 3/7 = ~0.43)
      const schedule: MedicineSchedule = {
        times: ['09:00'],
        daysOfWeek: [1, 3, 5],
        startDate: '2026-01-01',
      };
      expect(calculateDosesPerDay(schedule, false)).toBe(0.43);
    });

    it('returns 0 if schedule has empty times or empty days', () => {
      expect(calculateDosesPerDay({ times: [], daysOfWeek: [1, 2], startDate: '2026-01-01' }, false)).toBe(0);
      expect(calculateDosesPerDay({ times: ['08:00'], daysOfWeek: [], startDate: '2026-01-01' }, false)).toBe(0);
    });
  });

  describe('calculateDaysLeft & calculateRunOutDate', () => {
    it('returns null if dosesPerDay is 0 (as needed)', () => {
      expect(calculateDaysLeft(30, 0)).toBeNull();
      expect(calculateRunOutDate(null)).toBeNull();
    });

    it('calculates floor of remaining quantity divided by dosesPerDay', () => {
      // 30 tablets at 2 doses/day = 15 days
      expect(calculateDaysLeft(30, 2)).toBe(15);
      // 25 tablets at 2 doses/day = 12 days
      expect(calculateDaysLeft(25, 2)).toBe(12);
      // Support fractional stock (e.g. 10.5 tablets / 1 dose per day = 10 days)
      expect(calculateDaysLeft(10.5, 1)).toBe(10);
      // 0 stock = 0 days
      expect(calculateDaysLeft(0, 2)).toBe(0);
    });

    it('calculates correct run-out date from current date', () => {
      const baseDate = new Date('2026-01-01T00:00:00Z');
      const runOut = calculateRunOutDate(10, baseDate);
      expect(runOut).toBe('2026-01-11');
    });
  });

  describe('Refill Alert Tiers & Deduplication (shouldSendRefillAlert)', () => {
    it('assigns correct alert tier based on days left', () => {
      expect(calculateRefillAlertLevel(null)).toBe(0);
      expect(calculateRefillAlertLevel(10)).toBe(0);
      expect(calculateRefillAlertLevel(7)).toBe(7);
      expect(calculateRefillAlertLevel(5)).toBe(7);
      expect(calculateRefillAlertLevel(3)).toBe(3);
      expect(calculateRefillAlertLevel(2)).toBe(3);
      expect(calculateRefillAlertLevel(1)).toBe(1);
      expect(calculateRefillAlertLevel(0)).toBe(1);
    });

    it('never sends alert if current level is 0', () => {
      expect(shouldSendRefillAlert(0, 0)).toBe(false);
      expect(shouldSendRefillAlert(0, 7)).toBe(false);
    });

    it('never sends duplicate alert at the same level', () => {
      expect(shouldSendRefillAlert(7, 7)).toBe(false);
      expect(shouldSendRefillAlert(3, 3)).toBe(false);
      expect(shouldSendRefillAlert(1, 1)).toBe(false);
    });

    it('sends alert when transitioning to a more urgent tier', () => {
      // from normal (0) to gentle (7)
      expect(shouldSendRefillAlert(7, 0)).toBe(true);
      // from gentle (7) to urgent (3)
      expect(shouldSendRefillAlert(3, 7)).toBe(true);
      // from urgent (3) to critical (1)
      expect(shouldSendRefillAlert(1, 3)).toBe(true);
    });

    it('does not alert if stock was refilled and level went back up', () => {
      // was at 3, now at 7 because refilled -> current level 7 is less urgent than 3
      expect(shouldSendRefillAlert(7, 3)).toBe(false);
    });
  });

  describe('isDoseMissed', () => {
    it('returns false if scheduled dose is in the future', () => {
      const future = new Date(Date.now() + 30 * 60 * 1000);
      expect(isDoseMissed(future)).toBe(false);
    });

    it('returns false if within 60 minutes of scheduled time', () => {
      const scheduled = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes ago
      expect(isDoseMissed(scheduled)).toBe(false);
    });

    it('returns true if more than 60 minutes have elapsed since scheduled time', () => {
      const scheduled = new Date(Date.now() - 65 * 60 * 1000); // 65 minutes ago
      expect(isDoseMissed(scheduled)).toBe(true);
    });
  });

  describe('calculateAdherence', () => {
    it('returns 100% adherence when no scheduled doses exist', () => {
      const res = calculateAdherence([]);
      expect(res.sevenDayPercentage).toBe(100);
      expect(res.thirtyDayPercentage).toBe(100);
      expect(res.currentStreak).toBe(0);
    });

    it('computes percentage correctly with taken, missed, and skipped doses', () => {
      const now = new Date('2026-03-01T12:00:00Z');
      const logs: DoseLog[] = [
        {
          id: '1',
          circleId: 'c1',
          medicineId: 'med1',
          scheduledAt: '2026-03-01T08:00:00Z',
          status: 'taken',
          loggedAt: '2026-03-01T08:15:00Z',
          loggedBy: 'elder',
          escalationStep: 0,
        },
        {
          id: '2',
          circleId: 'c1',
          medicineId: 'med1',
          scheduledAt: '2026-02-28T08:00:00Z',
          status: 'skipped', // acknowledged skipped
          loggedAt: '2026-02-28T08:05:00Z',
          loggedBy: 'elder',
          escalationStep: 0,
        },
        {
          id: '3',
          circleId: 'c1',
          medicineId: 'med1',
          scheduledAt: '2026-02-27T08:00:00Z',
          status: 'missed',
          loggedAt: null,
          loggedBy: null,
          escalationStep: 3,
        },
        {
          id: '4',
          circleId: 'c1',
          medicineId: 'med1',
          scheduledAt: '2026-02-26T08:00:00Z',
          status: 'taken',
          loggedAt: '2026-02-26T08:00:00Z',
          loggedBy: 'elder',
          escalationStep: 0,
        },
      ];

      const res = calculateAdherence(logs, now);
      // 2 taken out of 4 total doses = 50%
      expect(res.sevenDayPercentage).toBe(50);
      expect(res.thirtyDayPercentage).toBe(50);
      expect(res.totalTaken30d).toBe(2);
      expect(res.totalSkipped30d).toBe(1);
      expect(res.totalMissed30d).toBe(1);
    });

    it('auto-detects missed dose if still pending past 60 minutes', () => {
      const now = new Date('2026-03-01T12:00:00Z');
      const logs: DoseLog[] = [
        {
          id: '1',
          circleId: 'c1',
          medicineId: 'med1',
          scheduledAt: '2026-03-01T08:00:00Z', // 4 hours ago, status still pending
          status: 'pending',
          loggedAt: null,
          loggedBy: null,
          escalationStep: 0,
        },
      ];

      const res = calculateAdherence(logs, now);
      expect(res.totalMissed30d).toBe(1);
      expect(res.sevenDayPercentage).toBe(0);
    });
  });
});
