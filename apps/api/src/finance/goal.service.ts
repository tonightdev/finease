import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { FinancialGoal } from '@repo/types';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import { TransactionsService } from './transactions.service';

@Injectable()
export class GoalService {
  private readonly collectionName = 'goals';

  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
    @Inject(forwardRef(() => TransactionsService))
    private readonly transactionsService: TransactionsService,
  ) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  async findAll(userId: string): Promise<FinancialGoal[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<FinancialGoal, 'id'>),
      }))
      .filter((goal) => !goal.deletedAt);
  }

  async create(goal: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const docRef = await this.collection.add({
      ...goal,
      deletedAt: null,
      startDate: goal.startDate || new Date().toISOString(),
    });
    const doc = await docRef.get();
    const result = { id: doc.id, ...(doc.data() as Omit<FinancialGoal, 'id'>) };

    // Log activity
    await this.activityLogService.logActivity({
      userId: result.userId,
      action: 'create',
      entityType: 'goal',
      entityId: doc.id,
      description: `Created goal: ${result.name}`,
      metadata: { targetAmount: result.targetAmount },
    });

    return result;
  }

  async update(
    id: string,
    goal: Partial<FinancialGoal>,
  ): Promise<FinancialGoal> {
    const currentGoal = (
      await this.collection.doc(id).get()
    ).data() as FinancialGoal;

    if (
      goal.currentAmount !== undefined &&
      Math.abs(goal.currentAmount - (currentGoal.currentAmount || 0)) > 0.01
    ) {
      const delta = goal.currentAmount - (currentGoal.currentAmount || 0);
      const newInitial = (currentGoal.initialAmount || 0) + delta;

      const updateData = { ...goal };
      delete updateData.currentAmount;

      await this.collection.doc(id).update({
        ...updateData,
        initialAmount: newInitial,
      });

      // Trigger recalculation to ensure everything is consistent
      await this.transactionsService.recalculateGoalProgress(id);
    }

    const updatedDoc = await this.collection.doc(id).get();
    const result = {
      id: updatedDoc.id,
      ...(updatedDoc.data() as Omit<FinancialGoal, 'id'>),
    };

    // Log activity
    await this.activityLogService.logActivity({
      userId: result.userId,
      action: 'update',
      entityType: 'goal',
      entityId: id,
      description: `Updated goal: ${result.name}`,
      previousState: currentGoal,
      newState: result,
    });

    return result;
  }

  async remove(id: string): Promise<void> {
    await this.collection.doc(id).update({
      deletedAt: new Date().toISOString(),
    });

    // Fetch details for logging
    const goalDoc = await this.collection.doc(id).get();
    const goalData = goalDoc.data() as FinancialGoal;

    // Log activity
    await this.activityLogService.logActivity({
      userId: goalData.userId,
      action: 'delete',
      entityType: 'goal',
      entityId: id,
      description: `Deleted goal: ${goalData.name}`,
    });
  }

  calculateMonthlyRequirement(goal: FinancialGoal): number {
    const now = new Date();
    const targetDate = new Date(goal.targetDate);

    // Calculate months remaining
    const monthsDiff =
      (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth());

    if (monthsDiff <= 0) return 0;

    const remainingAmount = goal.targetAmount - goal.currentAmount;
    if (remainingAmount <= 0) return 0;

    return Math.ceil(remainingAmount / monthsDiff);
  }

  getGoalHealth(goal: FinancialGoal): 'ahead' | 'behind' | 'ontrack' {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);

    if (!startDate || !targetDate) return 'ontrack';

    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    if (totalDuration <= 0) return 'ontrack';

    const expectedPercentage = (elapsed / totalDuration) * 100;
    const actualPercentage = (goal.currentAmount / goal.targetAmount) * 100;

    const diff = actualPercentage - expectedPercentage;

    if (diff > 5) return 'ahead';
    if (diff < -5) return 'behind';
    return 'ontrack';
  }
}
