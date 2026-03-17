import { Injectable, NotFoundException } from '@nestjs/common';

import { User, ActivityType } from '@repo/types';
import { FirebaseAdminService } from '../services/firebase-admin.service';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class UsersService {
  private readonly collectionName = 'users';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  getFirestore() {
    return this.firebaseAdmin.getFirestore();
  }

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async findOne(uid: string): Promise<User> {
    const doc = await this.collection.doc(uid).get();
    const data = doc.data() as Partial<User> | undefined;
    if (!doc.exists || data?.deletedAt) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }
    return { id: doc.id, ...data } as User;
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.collection.where('deletedAt', '==', null).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
  }
  async update(uid: string, data: Partial<User>): Promise<User> {
    const currentUser = await this.findOne(uid);

    await this.collection.doc(uid).set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    const updatedUser = await this.findOne(uid);

    // Log activity
    await this.activityLogService.logActivity({
      userId: uid,
      action: 'update' as ActivityType,
      entityType: 'profile',
      entityId: uid,
      description: `Updated profile details`,
      metadata: { updateData: data },
      previousState: currentUser,
      newState: updatedUser,
    });

    return updatedUser;
  }

  async enableTourForAll(adminId: string): Promise<{ updatedCount: number }> {
    const snapshot = await this.collection.get();
    const batch = this.getFirestore().batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        hasOnboarded: false,
        updatedAt: new Date().toISOString(),
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    // Log the global action
    await this.activityLogService.logActivity({
      userId: adminId,
      action: 'update' as ActivityType,
      entityType: 'system',
      description: `Enabled feature tour for all ${count} users`,
    });

    return { updatedCount: count };
  }
}
