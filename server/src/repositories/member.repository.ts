import { db } from '../config/firebase';
import { CircleMember } from '../types';

export class MemberRepository {
  private getSubcollection(circleId: string) {
    return db.collection('careCircles').doc(circleId).collection('members');
  }

  async findMember(circleId: string, uid: string): Promise<CircleMember | null> {
    const doc = await this.getSubcollection(circleId).doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as CircleMember;
  }

  async listMembers(circleId: string): Promise<CircleMember[]> {
    const snapshot = await this.getSubcollection(circleId).get();
    return snapshot.docs.map((doc) => doc.data() as CircleMember);
  }

  async saveMember(member: CircleMember): Promise<void> {
    await this.getSubcollection(member.circleId).doc(member.uid).set(member);
  }

  async updateMember(
    circleId: string,
    uid: string,
    data: Partial<CircleMember>
  ): Promise<void> {
    await this.getSubcollection(circleId).doc(uid).set(data, { merge: true });
  }

  async removeMember(circleId: string, uid: string): Promise<void> {
    await this.getSubcollection(circleId).doc(uid).delete();
  }

  async findMembershipsByUser(uid: string): Promise<CircleMember[]> {
    const snapshot = await db.collectionGroup('members').where('uid', '==', uid).get();
    return snapshot.docs.map((doc) => doc.data() as CircleMember);
  }
}

export const memberRepository = new MemberRepository();
