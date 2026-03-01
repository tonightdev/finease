import { Injectable } from '@nestjs/common';
import { FinancialGoal } from '@repo/types';

@Injectable()
export class GoalService {
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

    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    const expectedPercentage = (elapsed / totalDuration) * 100;
    const actualPercentage = (goal.currentAmount / goal.targetAmount) * 100;

    const diff = actualPercentage - expectedPercentage;

    if (diff > 5) return 'ahead';
    if (diff < -5) return 'behind';
    return 'ontrack';
  }
}
