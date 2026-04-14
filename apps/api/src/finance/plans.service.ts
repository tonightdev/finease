import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { ShortTermPlan } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class PlansService {
  private readonly collectionName = 'short-term-plans';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async findAll(userId: string): Promise<ShortTermPlan[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as ShortTermPlan)
      .filter((plan) => !plan.deletedAt);
  }

  async findOne(id: string): Promise<ShortTermPlan> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists || doc.data()?.deletedAt) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as ShortTermPlan;
  }

  async create(plan: Partial<ShortTermPlan>): Promise<ShortTermPlan> {
    const docRef = await this.collection.add({
      ...plan,
      deletedAt: null,
    });
    const doc = await docRef.get();
    const result = { id: doc.id, ...doc.data() } as ShortTermPlan;

    // Log activity
    if (result.userId) {
      await this.activityLogService.logActivity({
        userId: result.userId,
        action: 'create',
        entityType: 'plan',
        entityId: doc.id,
        description: `Created short-term plan: ${result.name}`,
      });
    }

    return result;
  }

  async update(
    id: string,
    plan: Partial<ShortTermPlan>,
  ): Promise<ShortTermPlan> {
    await this.findOne(id);

    await this.collection.doc(id).update({
      ...plan,
    });

    const updatedPlan = await this.findOne(id);

    // Log activity
    if (updatedPlan.userId) {
      await this.activityLogService.logActivity({
        userId: updatedPlan.userId,
        action: 'update',
        entityType: 'plan',
        entityId: id,
        description: `Updated short-term plan: ${updatedPlan.name}`,
      });
    }

    return updatedPlan;
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);

    await this.collection.doc(id).update({
      deletedAt: new Date().toISOString(),
    });

    // Log activity
    if (plan.userId) {
      await this.activityLogService.logActivity({
        userId: plan.userId,
        action: 'delete',
        entityType: 'plan',
        entityId: id,
        description: `Deleted short-term plan: ${plan.name}`,
      });
    }
  }
}
