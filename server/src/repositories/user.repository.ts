import { db } from '../config/firebase';
import { UserProfile } from '../types';

const COLLECTION = 'users';

export class UserRepository {
  async findById(uid: string): Promise<UserProfile | null> {
    const doc = await db.collection(COLLECTION).doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as UserProfile;
  }

  async upsert(user: Partial<UserProfile> & { uid: string }): Promise<UserProfile> {
    const docRef = db.collection(COLLECTION).doc(user.uid);
    const existing = await docRef.get();

    if (!existing.exists) {
      const newUser: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: user.name || user.email?.split('@')[0] || 'User',
        timezone: user.timezone || 'Asia/Kolkata',
        language: user.language || 'en',
        seniorMode: user.seniorMode ?? false,
        fcmTokens: user.fcmTokens || [],
        createdAt: new Date().toISOString(),
      };
      await docRef.set(newUser);
      return newUser;
    } else {
      const current = existing.data() as UserProfile;
      const updated: UserProfile = {
        ...current,
        name: user.name ?? current.name,
        timezone: user.timezone ?? current.timezone,
        language: user.language ?? current.language,
        seniorMode: user.seniorMode ?? current.seniorMode,
        fcmTokens: user.fcmTokens ?? current.fcmTokens,
      };
      await docRef.set(updated, { merge: true });
      return updated;
    }
  }

  async update(uid: string, data: Partial<UserProfile>): Promise<void> {
    await db.collection(COLLECTION).doc(uid).set(data, { merge: true });
  }
}

export const userRepository = new UserRepository();
