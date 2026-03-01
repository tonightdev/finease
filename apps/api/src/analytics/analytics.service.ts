import { Injectable } from '@nestjs/common';
import { DashboardStats } from '@repo/types';

@Injectable()
export class AnalyticsService {
  /**
   * Formats raw Firestore transaction and asset data into Recharts-friendly JSON
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Simulate async network request
    await Promise.resolve();
    if (!userId) {
      throw new Error('userId is required');
    }

    // In a real implementation, this would fetch from Firestore:
    // const assets = await this.firestore.collection('users').doc(userId).collection('assets').get();
    // const liabilities = await this.firestore.collection('users').doc(userId).collection('liabilities').get();

    // Logic for "Net Worth" over time
    const netWorthHistory = [
      { month: 'Jan', value: 95000 },
      { month: 'Feb', value: 98000 },
      { month: 'Mar', value: 103000 },
      { month: 'Apr', value: 110000 },
      { month: 'May', value: 115000 },
      { month: 'Jun', value: 125430 },
    ];

    // Mock properties matching DashboardStats interface
    const assetAllocation = [
      { name: 'Equity', value: 7650000, color: '#135bec' },
      { name: 'Debt', value: 2780000, color: '#10b981' },
      { name: 'Gold', value: 1390000, color: '#f59e0b' },
      { name: 'Liquid', value: 630000, color: '#ef4444' },
    ];

    const goalPacing = [
      {
        goalId: 'goal-1',
        goalName: 'Retirement',
        actualPercentage: 65,
        expectedPercentage: 62,
        status: 'ahead' as const,
      },
      {
        goalId: 'goal-2',
        goalName: 'Child Education',
        actualPercentage: 42,
        expectedPercentage: 48,
        status: 'behind' as const,
      },
    ];

    const MOCK_TOTAL_ASSETS = 13250000;
    const MOCK_TOTAL_LIABILITIES = 800000;

    return {
      netWorth: MOCK_TOTAL_ASSETS - MOCK_TOTAL_LIABILITIES,
      totalAssets: MOCK_TOTAL_ASSETS,
      totalLiabilities: MOCK_TOTAL_LIABILITIES,
      netWorthHistory,
      assetAllocation,
      goalPacing,
    };
  }
}
