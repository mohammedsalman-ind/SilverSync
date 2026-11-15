import { doseLogRepository } from '../repositories/doseLog.repository';
import { medicineRepository } from '../repositories/medicine.repository';
import { calculateAdherence, AdherenceMetrics } from '../utils/medication';

export class AdherenceService {
  async getAdherenceMetrics(circleId: string): Promise<AdherenceMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const [logs, medicines] = await Promise.all([
      doseLogRepository.findLogsByCircleAndRange(circleId, thirtyDaysAgo, nowIso),
      medicineRepository.findActiveByCircleId(circleId),
    ]);

    const medNameMap = new Map(medicines.map((m) => [m.id, m.name]));
    const metrics = calculateAdherence(logs, now);

    // Enrich medicine breakdown with names
    const enrichedMedBreakdown = metrics.medicineBreakdown.map((m) => ({
      ...m,
      medicineName: medNameMap.get(m.medicineId) || 'Medication',
    }));

    return {
      ...metrics,
      medicineBreakdown: enrichedMedBreakdown,
    };
  }
}

export const adherenceService = new AdherenceService();
