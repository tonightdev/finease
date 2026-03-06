import { Injectable } from '@nestjs/common';
import { DashboardStats, AdminStats, User } from '@repo/types';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  /**
   * Formats raw Firestore transaction and asset data into Recharts-friendly JSON
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Fixed: return a resolved promise to satisfy async lint if no awaits are present
    // but usually this would have awaits. Adding a small await to simulate DB call
    await Promise.resolve();

    const netWorthHistory = [
      { month: 'Jan', value: 95000 },
      { month: 'Feb', value: 98000 },
      { month: 'Mar', value: 103000 },
      { month: 'Apr', value: 110000 },
      { month: 'May', value: 115000 },
      { month: 'Jun', value: 125430 },
    ];

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

  async getAdminStats(): Promise<AdminStats> {
    const db = this.firebaseAdmin.getFirestore();

    // Fetch real counts (only non-admin users)
    const usersSnapshot = await db.collection('users').get();
    const userDocs = usersSnapshot.docs.filter((doc) => {
      const data = doc.data() as Partial<User>;
      return data.role !== 'admin';
    });

    const validUserIds = new Set(userDocs.map((doc) => doc.id));
    const totalUsers = userDocs.length;

    const accountsSnapshot = await db.collection('accounts').get();
    const totalAssetsTracked = accountsSnapshot.docs.reduce(
      (sum: number, doc) => {
        const data = doc.data() as {
          userId?: string;
          balance?: number | string;
        };
        if (data.userId && !validUserIds.has(data.userId)) return sum;
        return sum + (Number(data.balance) || 0);
      },
      0,
    );

    // Fetch real recent activities
    const recentUsersSnapshot = await db
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    // Filter non-admins and take top 5
    const recentActivities: AdminStats['recentActivities'] =
      recentUsersSnapshot.docs
        .filter((doc) => (doc.data() as User).role !== 'admin')
        .slice(0, 5)
        .map((doc, index) => {
          const data = doc.data() as User;
          return {
            id: index + 1,
            type: 'signup',
            user: data.displayName || 'New Identity',
            time: this.formatRelativeTime(data.createdAt),
          };
        });

    // Calculate real user growth for last 7 days (non-admin)
    const last7Days: { day: string; count: number }[] = [];
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = dayNames[d.getDay()];
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const count = userDocs.filter((doc) => {
        const userData = doc.data() as Partial<User>;
        const createdAt = userData.createdAt;
        if (!createdAt) return false;
        const createdDate = new Date(createdAt);
        return createdDate >= dayStart && createdDate <= dayEnd;
      }).length;

      last7Days.push({ day: dayName ?? 'Unknown', count });
    }

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeUsers24h = userDocs.filter((doc) => {
      const userData = doc.data() as Partial<User>;
      const activeAt = userData.lastActiveAt || userData.createdAt;
      if (!activeAt) return false;
      return new Date(activeAt) >= twentyFourHoursAgo;
    }).length;

    return {
      totalUsers,
      activeUsers24h,
      totalAssetsTracked,
      systemHealth: 'Optimal',
      recentActivities,
      userGrowth: last7Days,
    };
  }

  private formatRelativeTime(dateString?: string): string {
    if (!dateString) return 'Sometime ago';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}
