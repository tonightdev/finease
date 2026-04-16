import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { BudgetStrategy, StrategyEntry } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class StrategyService {
  private readonly collectionName = 'strategies';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async getStrategy(userId: string): Promise<BudgetStrategy | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as BudgetStrategy;
  }

  async saveStrategy(
    userId: string,
    data: Partial<BudgetStrategy>,
  ): Promise<BudgetStrategy> {
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
      entityType: 'strategy',
      entityId: userId,
      description: `Saved Budget Strategy state`,
    });

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as BudgetStrategy;
  }

  async addEntry(userId: string, entry: StrategyEntry): Promise<BudgetStrategy> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    const currentData = doc.exists ? (doc.data() as BudgetStrategy) : null;
    const entries = currentData?.entries || [];

    const newEntries = [...entries, entry];
    return this.saveStrategy(userId, { entries: newEntries });
  }

  async updateEntry(
    userId: string,
    entryId: string,
    entryData: Partial<StrategyEntry>,
  ): Promise<BudgetStrategy> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    const currentData = doc.exists ? (doc.data() as BudgetStrategy) : null;
    if (!currentData) throw new Error('Strategy not found');

    const newEntries = currentData.entries.map((e) =>
      e.id === entryId ? { ...e, ...entryData } : e,
    );
    return this.saveStrategy(userId, { entries: newEntries });
  }

  async removeEntry(
    userId: string,
    entryId: string,
  ): Promise<BudgetStrategy> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    const currentData = doc.exists ? (doc.data() as BudgetStrategy) : null;
    if (!currentData) throw new Error('Strategy not found');

    const newEntries = currentData.entries.filter((e) => e.id !== entryId);
    return this.saveStrategy(userId, { entries: newEntries });
  }
}
