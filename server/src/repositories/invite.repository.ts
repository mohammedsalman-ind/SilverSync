import { db } from '../config/firebase';
import { Invite } from '../types';

export class InviteRepository {
  async createInvite(invite: Invite): Promise<void> {
    await db
      .collection('careCircles')
      .doc(invite.circleId)
      .collection('invites')
      .doc(invite.id)
      .set(invite);
  }

  async findInviteByHash(codeHash: string): Promise<Invite | null> {
    const snapshot = await db
      .collectionGroup('invites')
      .where('codeHash', '==', codeHash)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Invite;
  }

  async markInviteUsed(circleId: string, inviteId: string, usedBy: string): Promise<void> {
    await db
      .collection('careCircles')
      .doc(circleId)
      .collection('invites')
      .doc(inviteId)
      .update({
        usedAt: new Date().toISOString(),
        usedBy,
      });
  }
}

export const inviteRepository = new InviteRepository();
