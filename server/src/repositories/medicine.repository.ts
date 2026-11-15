import { db } from '../config/firebase';
import { Medicine } from '../types';

const COLLECTION = 'medicines';

export class MedicineRepository {
  async create(medicine: Medicine): Promise<void> {
    await db.collection(COLLECTION).doc(medicine.id).set(medicine);
  }

  async findById(id: string): Promise<Medicine | null> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as Medicine;
  }

  async findActiveByCircleId(circleId: string): Promise<Medicine[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where('circleId', '==', circleId)
      .where('active', '==', true)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Medicine);
  }

  async update(id: string, data: Partial<Medicine>): Promise<void> {
    await db.collection(COLLECTION).doc(id).set(data, { merge: true });
  }

  async decrementQuantity(id: string, amount = 1): Promise<number> {
    return db.runTransaction(async (transaction) => {
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        throw new Error('Medicine document not found');
      }
      const current = doc.data() as Medicine;
      const newQuantity = Math.max(0, Number((current.quantityRemaining - amount).toFixed(2)));
      transaction.update(docRef, { quantityRemaining: newQuantity });
      return newQuantity;
    });
  }

  async addQuantity(id: string, amount: number): Promise<number> {
    return db.runTransaction(async (transaction) => {
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        throw new Error('Medicine document not found');
      }
      const current = doc.data() as Medicine;
      const newQuantity = Number((current.quantityRemaining + amount).toFixed(2));
      transaction.update(docRef, {
        quantityRemaining: newQuantity,
        lastRefillAlertLevel: 0, // Reset alert level upon refill
      });
      return newQuantity;
    });
  }
}

export const medicineRepository = new MedicineRepository();
