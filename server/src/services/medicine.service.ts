import crypto from 'crypto';
import { medicineRepository } from '../repositories/medicine.repository';
import { proposalRepository } from '../repositories/proposal.repository';
import { AppError } from '../middleware/errorHandler';
import {
  Medicine,
  MedicineSchedule,
  Role,
  ProposedChange,
} from '../types';
import {
  calculateDosesPerDay,
  calculateDaysLeft,
  calculateRunOutDate,
  calculateRefillAlertLevel,
} from '../utils/medication';

export interface EnrichedMedicine extends Medicine {
  dosesPerDay: number;
  daysLeft: number | null;
  runOutDate: string | null;
  alertLevel: 0 | 7 | 3 | 1;
}

export class MedicineService {
  async createMedicine(
    circleId: string,
    callerUid: string,
    callerRole: Role,
    data: {
      name: string;
      dosage: string;
      form: string;
      schedule: MedicineSchedule;
      asNeeded: boolean;
      quantityRemaining: number;
      refillThresholdDays: number;
      notes?: string;
    }
  ): Promise<{ direct: boolean; medicine?: Medicine; proposal?: ProposedChange }> {
    // ELDER creates directly; Family/Caregiver proposals require Elder approval
    if (callerRole === 'ELDER') {
      const medicine: Medicine = {
        id: crypto.randomUUID(),
        circleId,
        name: data.name,
        dosage: data.dosage,
        form: data.form,
        schedule: data.schedule,
        asNeeded: data.asNeeded,
        quantityRemaining: data.quantityRemaining,
        refillThresholdDays: data.refillThresholdDays,
        lastRefillAlertLevel: 0,
        notes: data.notes,
        active: true,
      };

      await medicineRepository.create(medicine);
      return { direct: true, medicine };
    } else {
      // Create ProposedChange for Elder review
      const proposal: ProposedChange = {
        id: crypto.randomUUID(),
        circleId,
        type: 'create',
        payload: data,
        proposedBy: callerUid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        decidedAt: null,
      };

      await proposalRepository.create(proposal);
      return { direct: false, proposal };
    }
  }

  async updateMedicine(
    medicineId: string,
    circleId: string,
    callerUid: string,
    callerRole: Role,
    data: Partial<Medicine>
  ): Promise<{ direct: boolean; medicine?: Medicine; proposal?: ProposedChange }> {
    const existing = await medicineRepository.findById(medicineId);
    if (!existing || existing.circleId !== circleId || !existing.active) {
      throw new AppError('Medicine not found in this circle', 404, 'NOT_FOUND');
    }

    if (callerRole === 'ELDER') {
      await medicineRepository.update(medicineId, data);
      const updated = await medicineRepository.findById(medicineId);
      return { direct: true, medicine: updated! };
    } else {
      const proposal: ProposedChange = {
        id: crypto.randomUUID(),
        circleId,
        type: 'update',
        targetId: medicineId,
        payload: data,
        proposedBy: callerUid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        decidedAt: null,
      };

      await proposalRepository.create(proposal);
      return { direct: false, proposal };
    }
  }

  async deleteMedicine(
    medicineId: string,
    circleId: string,
    callerUid: string,
    callerRole: Role
  ): Promise<{ direct: boolean; proposal?: ProposedChange }> {
    const existing = await medicineRepository.findById(medicineId);
    if (!existing || existing.circleId !== circleId || !existing.active) {
      throw new AppError('Medicine not found in this circle', 404, 'NOT_FOUND');
    }

    if (callerRole === 'ELDER') {
      await medicineRepository.update(medicineId, { active: false });
      return { direct: true };
    } else {
      const proposal: ProposedChange = {
        id: crypto.randomUUID(),
        circleId,
        type: 'delete',
        targetId: medicineId,
        payload: { medicineName: existing.name },
        proposedBy: callerUid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        decidedAt: null,
      };

      await proposalRepository.create(proposal);
      return { direct: false, proposal };
    }
  }

  async refillMedicine(
    medicineId: string,
    circleId: string,
    quantityAdded: number
  ): Promise<{ quantityRemaining: number }> {
    const existing = await medicineRepository.findById(medicineId);
    if (!existing || existing.circleId !== circleId || !existing.active) {
      throw new AppError('Medicine not found', 404, 'NOT_FOUND');
    }

    const newQuantity = await medicineRepository.addQuantity(medicineId, quantityAdded);
    return { quantityRemaining: newQuantity };
  }

  async listMedicines(circleId: string): Promise<EnrichedMedicine[]> {
    const medicines = await medicineRepository.findActiveByCircleId(circleId);

    return medicines.map((med) => {
      const dosesPerDay = calculateDosesPerDay(med.schedule, med.asNeeded);
      const daysLeft = calculateDaysLeft(med.quantityRemaining, dosesPerDay);
      const runOutDate = calculateRunOutDate(daysLeft);
      const alertLevel = calculateRefillAlertLevel(daysLeft);

      return {
        ...med,
        dosesPerDay,
        daysLeft,
        runOutDate,
        alertLevel,
      };
    });
  }
}

export const medicineService = new MedicineService();
