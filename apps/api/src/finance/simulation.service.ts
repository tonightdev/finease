import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { BudgetSimulation, SimEntry } from '@repo/types';
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
      description: `Saved Budget Simulation state`,
    });

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as BudgetSimulation;
  }

  async addEntry(userId: string, entry: SimEntry): Promise<BudgetSimulation> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    const currentData = doc.exists ? (doc.data() as BudgetSimulation) : null;
    const entries = currentData?.entries || [];

    const newEntries = [...entries, entry];
    return this.saveSimulation(userId, { entries: newEntries });
  }

  async updateEntry(
    userId: string,
    entryId: string,
    entryData: Partial<SimEntry>,
  ): Promise<BudgetSimulation> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    const currentData = doc.exists ? (doc.data() as BudgetSimulation) : null;
    if (!currentData) throw new Error('Simulation not found');

    const newEntries = currentData.entries.map((e) =>
      e.id === entryId ? { ...e, ...entryData } : e,
    );
    return this.saveSimulation(userId, { entries: newEntries });
  }

  async removeEntry(
    userId: string,
    entryId: string,
  ): Promise<BudgetSimulation> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    const currentData = doc.exists ? (doc.data() as BudgetSimulation) : null;
    if (!currentData) throw new Error('Simulation not found');

    const newEntries = currentData.entries.filter((e) => e.id !== entryId);
    return this.saveSimulation(userId, { entries: newEntries });
  }
}
