import { db } from '../config/firebase';
import { ProposedChange, ProposalStatus } from '../types';

const COLLECTION = 'proposedChanges';

export class ProposalRepository {
  async create(proposal: ProposedChange): Promise<void> {
    await db.collection(COLLECTION).doc(proposal.id).set(proposal);
  }

  async findById(id: string): Promise<ProposedChange | null> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as ProposedChange;
  }

  async findPendingByCircleId(circleId: string): Promise<ProposedChange[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where('circleId', '==', circleId)
      .where('status', '==', 'pending')
      .get();

    return snapshot.docs.map((doc) => doc.data() as ProposedChange);
  }

  async updateStatus(id: string, status: ProposalStatus, decidedAt: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      status,
      decidedAt,
    });
  }
}

export const proposalRepository = new ProposalRepository();
