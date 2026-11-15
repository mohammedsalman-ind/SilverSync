import { db } from '../config/firebase';
import { CareCircle } from '../types';

const COLLECTION = 'careCircles';

export class CircleRepository {
  async create(circle: CareCircle): Promise<void> {
    await db.collection(COLLECTION).doc(circle.id).set(circle);
  }

  async findById(circleId: string): Promise<CareCircle | null> {
    const doc = await db.collection(COLLECTION).doc(circleId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as CareCircle;
  }

  async findCirclesByElderUid(elderUid: string): Promise<CareCircle[]> {
    const snapshot = await db.collection(COLLECTION).where('elderUid', '==', elderUid).get();
    return snapshot.docs.map((doc) => doc.data() as CareCircle);
  }

  async delete(circleId: string): Promise<void> {
    await db.collection(COLLECTION).doc(circleId).delete();
  }
}

export const circleRepository = new CircleRepository();
