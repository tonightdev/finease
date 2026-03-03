import { Injectable, NotFoundException } from '@nestjs/common';

import { User } from '@repo/types';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';

@Injectable()
export class UsersService {
  private readonly collectionName = 'users';

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async findOne(uid: string): Promise<User> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }
    return { id: doc.id, ...doc.data() } as User;
  }

  async update(uid: string, data: Partial<User>): Promise<User> {
    await this.collection.doc(uid).set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return this.findOne(uid);
  }
}
