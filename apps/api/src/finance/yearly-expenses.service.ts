import * as admin from 'firebase-admin';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { YearlyExpense, ActivityType } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';
import { AccountsService } from './accounts.service';

@Injectable()
export class YearlyExpensesService {
  private readonly collectionName = 'yearly_expenses';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
    private readonly accountsService: AccountsService,
  ) {}

  private get collection(): admin.firestore.CollectionReference<YearlyExpense> {
    return this.firebaseAdmin
      .getFirestore()
      .collection(
        this.collectionName,
      ) as admin.firestore.CollectionReference<YearlyExpense>;
  }

  async findAll(userId: string): Promise<YearlyExpense[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
        } as YearlyExpense;
      })
      .filter((item) => !item.deletedAt);

    // Hydrate account names
    const accounts = await this.accountsService.findAll(userId);
    return items.map((item) => {
      const account = accounts.find((a) => a.id === item.accountId);
      return {
        ...item,
        accountName: account?.name || 'Unlinked Node',
      };
    });
  }

  async findOne(userId: string, id: string): Promise<YearlyExpense> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists || doc.data()?.userId !== userId || doc.data()?.deletedAt) {
      throw new NotFoundException(`Yearly expense with ID ${id} not found`);
    }
    const item = { id: doc.id, ...doc.data() } as YearlyExpense;
    
    // Hydrate account name
    try {
      const account = await this.accountsService.findOne(item.accountId);
      return { ...item, accountName: account.name };
    } catch {
      return { ...item, accountName: 'Unlinked Node' };
    }
  }

  async create(userId: string, data: Partial<YearlyExpense>): Promise<YearlyExpense> {
    const docRef = this.collection.doc();
    const now = new Date().toISOString();
    
    const newExpense: YearlyExpense = {
      id: docRef.id,
      userId,
      title: data.title || '',
      yearlyAmount: Number(data.yearlyAmount || 0),
      accountId: data.accountId || '',
      createdAt: now,
      deletedAt: null,
    };

    await docRef.set(newExpense);

    // Log activity
    await this.activityLogService.logActivity({
      userId,
      action: 'create' as ActivityType,
      entityType: 'yearly_expense',
      entityId: docRef.id,
      description: `Created yearly commitment: ${newExpense.title}`,
      metadata: { amount: newExpense.yearlyAmount },
    });

    return newExpense;
  }

  async update(userId: string, id: string, data: Partial<YearlyExpense>): Promise<YearlyExpense> {
    const expenseRef = this.collection.doc(id);
    const doc = await expenseRef.get();

    if (!doc.exists || doc.data()?.userId !== userId || doc.data()?.deletedAt) {
      throw new NotFoundException(`Yearly expense with ID ${id} not found`);
    }

    const prevState = { id: doc.id, ...doc.data() } as YearlyExpense;
    const updateData = {
      ...data,
      yearlyAmount: data.yearlyAmount !== undefined ? Number(data.yearlyAmount) : prevState.yearlyAmount,
    };
    
    // Remove ID and other immutable fields from update payload
    delete (updateData as any).id;
    delete (updateData as any).userId;
    delete (updateData as any).createdAt;

    await expenseRef.update(updateData);
    const updated = await this.findOne(userId, id);

    // Log activity
    await this.activityLogService.logActivity({
      userId,
      action: 'update' as ActivityType,
      entityType: 'yearly_expense',
      entityId: id,
      description: `Updated yearly commitment: ${updated.title}`,
      previousState: prevState,
      newState: updated,
    });

    return updated;
  }

  async remove(userId: string, id: string, hard = false): Promise<void> {
    const expenseRef = this.collection.doc(id);
    const doc = await expenseRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException(`Yearly expense with ID ${id} not found`);
    }

    const item = doc.data() as YearlyExpense;

    if (hard) {
      await expenseRef.delete();
    } else {
      await expenseRef.update({
        deletedAt: new Date().toISOString(),
      } as any);
    }

    // Log activity
    await this.activityLogService.logActivity({
      userId,
      action: 'delete' as ActivityType,
      entityType: 'yearly_expense',
      entityId: id,
      description: `Deleted yearly commitment: ${item.title}`,
    });
  }
}
