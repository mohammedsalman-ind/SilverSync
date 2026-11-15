import crypto from 'crypto';
import { doseLogRepository } from '../repositories/doseLog.repository';
import { medicineRepository } from '../repositories/medicine.repository';
import { isDoseMissed } from '../utils/medication';
import { AppError } from '../middleware/errorHandler';
import { DoseLog, DoseStatus, Medicine } from '../types';

export interface EnrichedDoseLog extends DoseLog {
  medicineName: string;
  dosage: string;
  form: string;
  notes?: string;
}

export class DoseService {
  async getTodayDoses(circleId: string, timezone = 'Asia/Kolkata'): Promise<EnrichedDoseLog[]> {
    // Current date in target timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayDateStr = formatter.format(now); // YYYY-MM-DD

    const dayOfWeek = new Date(`${todayDateStr}T12:00:00Z`).getUTCDay(); // 0 = Sunday

    const startOfDayIso = `${todayDateStr}T00:00:00.000Z`;
    const endOfDayIso = `${todayDateStr}T23:59:59.999Z`;

    const [medicines, existingLogs] = await Promise.all([
      medicineRepository.findActiveByCircleId(circleId),
      doseLogRepository.findLogsByCircleAndRange(circleId, startOfDayIso, endOfDayIso),
    ]);

    const medMap = new Map<string, Medicine>(medicines.map((m) => [m.id, m]));
    const logsToCreate: DoseLog[] = [];
    const allLogs: DoseLog[] = [...existingLogs];

    // Check scheduled medicines for today
    for (const med of medicines) {
      if (med.asNeeded) {
        continue; // As-needed medicines are logged on-demand
      }

      // Check date range
      if (med.schedule.startDate > todayDateStr) {
        continue;
      }
      if (med.schedule.endDate && med.schedule.endDate < todayDateStr) {
        continue;
      }

      // Check day of week
      if (!med.schedule.daysOfWeek.includes(dayOfWeek)) {
        continue;
      }

      // Check each scheduled time (e.g. "08:00")
      for (const timeStr of med.schedule.times) {
        const scheduledAtIso = `${todayDateStr}T${timeStr}:00.000Z`;

        const existing = allLogs.find(
          (l) => l.medicineId === med.id && l.scheduledAt === scheduledAtIso
        );

        if (!existing) {
          const newLog: DoseLog = {
            id: crypto.randomUUID(),
            circleId,
            medicineId: med.id,
            scheduledAt: scheduledAtIso,
            status: 'pending',
            loggedAt: null,
            loggedBy: null,
            escalationStep: 0,
          };
          logsToCreate.push(newLog);
          allLogs.push(newLog);
        }
      }
    }

    if (logsToCreate.length > 0) {
      await doseLogRepository.createBatch(logsToCreate);
    }

    // Auto-update missed status if scheduled > 60 min ago and still pending
    const enriched: EnrichedDoseLog[] = [];
    for (const log of allLogs) {
      let currentStatus = log.status;
      if (currentStatus === 'pending' && isDoseMissed(log.scheduledAt, now)) {
        currentStatus = 'missed';
        await doseLogRepository.updateStatus(log.id, 'missed', now.toISOString(), 'system');
      }

      const med = medMap.get(log.medicineId);
      enriched.push({
        ...log,
        status: currentStatus,
        medicineName: med?.name || 'Medication',
        dosage: med?.dosage || '',
        form: med?.form || '',
        notes: med?.notes,
      });
    }

    return enriched.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  async logDose(
    logId: string,
    circleId: string,
    callerUid: string,
    status: 'taken' | 'skipped'
  ): Promise<DoseLog> {
    const log = await doseLogRepository.findById(logId);
    if (!log || log.circleId !== circleId) {
      throw new AppError('Dose log record not found', 404, 'NOT_FOUND');
    }

    const nowIso = new Date().toISOString();

    // Only decrement stock when status is TAKEN (support 0.5 tablets)
    // Never decrement stock on skipped or missed
    if (status === 'taken') {
      await medicineRepository.decrementQuantity(log.medicineId, 1);
    }

    await doseLogRepository.updateStatus(logId, status, nowIso, callerUid);

    return {
      ...log,
      status,
      loggedAt: nowIso,
      loggedBy: callerUid,
    };
  }
}

export const doseService = new DoseService();
