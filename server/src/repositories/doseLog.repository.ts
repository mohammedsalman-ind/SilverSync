import { db } from '../config/firebase';
import { DoseLog, DoseStatus } from '../types';

const COLLECTION = 'doseLogs';

export class DoseLogRepository {
  async create(log: DoseLog): Promise<void> {
    await db.collection(COLLECTION).doc(log.id).set(log);
  }

  async createBatch(logs: DoseLog[]): Promise<void> {
    if (logs.length === 0) return;
    const batch = db.batch();
    for (const log of logs) {
      const docRef = db.collection(COLLECTION).doc(log.id);
      batch.set(docRef, log);
    }
    await batch.commit();
  }

  async findById(id: string): Promise<DoseLog | null> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as DoseLog;
  }

  async findLogsByCircleAndRange(
    circleId: string,
    startIso: string,
    endIso: string
  ): Promise<DoseLog[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where('circleId', '==', circleId)
      .where('scheduledAt', '>=', startIso)
      .where('scheduledAt', '<=', endIso)
      .get();

    return snapshot.docs.map((doc) => doc.data() as DoseLog);
  }

  async updateStatus(
    id: string,
    status: DoseStatus,
    loggedAt: string,
    loggedBy: string
  ): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      status,
      loggedAt,
      loggedBy,
    });
  }

  async updateEscalationStep(id: string, step: number): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      escalationStep: step,
    });
  }
}

export const doseLogRepository = new DoseLogRepository();
