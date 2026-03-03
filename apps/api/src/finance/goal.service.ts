import { Injectable } from '@nestjs/common';
import { FinancialGoal } from '@repo/types';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';

@Injectable()
export class GoalService {
  private readonly collectionName = 'goals';

  constructor(private readonly firebase: FirebaseAdminService) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  async findAll(userId: string): Promise<FinancialGoal[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<FinancialGoal, 'id'>),
    }));
  }

  async create(goal: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const docRef = await this.collection.add({
      ...goal,
      startDate: goal.startDate || new Date().toISOString(),
    });
    const doc = await docRef.get();
    return { id: doc.id, ...(doc.data() as Omit<FinancialGoal, 'id'>) };
  }

  async update(id: string, goal: Partial<FinancialGoal>): Promise<FinancialGoal> {
    await this.collection.doc(id).update(goal);
    const doc = await this.collection.doc(id).get();
    return { id: doc.id, ...(doc.data() as Omit<FinancialGoal, 'id'>) };
  }

  async remove(id: string): Promise<void> {
    await this.collection.doc(id).delete();
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
