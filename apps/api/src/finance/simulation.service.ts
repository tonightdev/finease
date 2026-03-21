import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { BudgetSimulation } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class SimulationService {
  private readonly collectionName = 'simulations';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async getSimulation(userId: string): Promise<BudgetSimulation | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as BudgetSimulation;
  }

  async saveSimulation(
    userId: string,
    data: Partial<BudgetSimulation>,
  ): Promise<BudgetSimulation> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();

    const payload = {
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (doc.exists) {
      await docRef.update(payload);
    } else {
      await docRef.set(payload);
    }

    // Log activity
    await this.activityLogService.logActivity({
      userId,
      action: doc.exists ? 'update' : 'create',
      entityType: 'simulation',
      entityId: userId,
      description: `Saved Budget Simulation snapshot`,
    });

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as BudgetSimulation;
  }
}
