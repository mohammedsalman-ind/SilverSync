import crypto from 'crypto';
import { proposalRepository } from '../repositories/proposal.repository';
import { medicineRepository } from '../repositories/medicine.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/errorHandler';
import { ProposedChange, Medicine, MedicineSchedule } from '../types';

export interface EnrichedProposal extends ProposedChange {
  proposerName?: string;
  proposerEmail?: string;
}

export class ProposalService {
  async listPending(circleId: string): Promise<EnrichedProposal[]> {
    const proposals = await proposalRepository.findPendingByCircleId(circleId);

    const enriched: EnrichedProposal[] = [];
    for (const p of proposals) {
      const user = await userRepository.findById(p.proposedBy);
      enriched.push({
        ...p,
        proposerName: user?.name || 'Care Circle Member',
        proposerEmail: user?.email || '',
      });
    }

    return enriched;
  }

  async approve(proposalId: string, elderUid: string): Promise<{ success: boolean; message: string }> {
    const proposal = await proposalRepository.findById(proposalId);
    if (!proposal || proposal.status !== 'pending') {
      throw new AppError('Proposal not found or already decided', 404, 'NOT_FOUND');
    }

    const nowIso = new Date().toISOString();

    if (proposal.type === 'create') {
      const p = proposal.payload as {
        name: string;
        dosage: string;
        form: string;
        schedule: MedicineSchedule;
        asNeeded: boolean;
        quantityRemaining: number;
        refillThresholdDays: number;
        notes?: string;
      };

      const newMedicine: Medicine = {
        id: crypto.randomUUID(),
        circleId: proposal.circleId,
        name: p.name,
        dosage: p.dosage,
        form: p.form,
        schedule: p.schedule,
        asNeeded: p.asNeeded,
        quantityRemaining: p.quantityRemaining,
        refillThresholdDays: p.refillThresholdDays,
        lastRefillAlertLevel: 0,
        notes: p.notes,
        active: true,
      };

      await medicineRepository.create(newMedicine);
    } else if (proposal.type === 'update' && proposal.targetId) {
      await medicineRepository.update(proposal.targetId, proposal.payload as Partial<Medicine>);
    } else if (proposal.type === 'delete' && proposal.targetId) {
      await medicineRepository.update(proposal.targetId, { active: false });
    }

    await proposalRepository.updateStatus(proposalId, 'approved', nowIso);

    return {
      success: true,
      message: 'Proposed change successfully approved and applied by Elder.',
    };
  }

  async reject(proposalId: string, _elderUid: string): Promise<{ success: boolean; message: string }> {
    const proposal = await proposalRepository.findById(proposalId);
    if (!proposal || proposal.status !== 'pending') {
      throw new AppError('Proposal not found or already decided', 404, 'NOT_FOUND');
    }

    const nowIso = new Date().toISOString();
    await proposalRepository.updateStatus(proposalId, 'rejected', nowIso);

    return {
      success: true,
      message: 'Proposed change rejected.',
    };
  }
}

export const proposalService = new ProposalService();
