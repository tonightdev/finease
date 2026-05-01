import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { Simulation } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class SimulationsService {
  private readonly collectionName = 'simulations';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async findAll(userId: string): Promise<Simulation[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Simulation)
      .filter((plan) => !plan.deletedAt);
  }

  async findOne(id: string): Promise<Simulation> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists || doc.data()?.deletedAt) {
      throw new NotFoundException(`Simulation with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as Simulation;
  }

  async create(plan: Partial<Simulation>): Promise<Simulation> {
    const docRef = await this.collection.add({
      ...plan,
      deletedAt: null,
      status: plan.status || 'ongoing',
    });
    const doc = await docRef.get();
    const result = { id: doc.id, ...doc.data() } as Simulation;

    // Log activity
    if (result.userId) {
      await this.activityLogService.logActivity({
        userId: result.userId,
        action: 'create',
        entityType: 'simulation',
        entityId: doc.id,
        description: `Created simulation: ${result.name}`,
      });
    }

    return result;
  }

  async update(id: string, plan: Partial<Simulation>): Promise<Simulation> {
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
        entityType: 'simulation',
        entityId: id,
        description: `Updated simulation: ${updatedPlan.name}`,
      });
    }

    return updatedPlan;
  }

  async remove(id: string, hard = false): Promise<void> {
    const plan = await this.findOne(id);
    const docRef = this.collection.doc(id);

    if (hard) {
      await docRef.delete();
    } else {
      await docRef.update({
        deletedAt: new Date().toISOString(),
      });
    }

    // Log activity
    if (plan.userId) {
      await this.activityLogService.logActivity({
        userId: plan.userId,
        action: 'delete',
        entityType: 'simulation',
        entityId: id,
        description: `Deleted simulation: ${plan.name}`,
      });
    }
  }
}
