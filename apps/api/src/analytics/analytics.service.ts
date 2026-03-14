import { Injectable } from '@nestjs/common';
import {
  DashboardStats,
  AdminStats,
  User,
  Account,
  FinancialGoal,
  AssetClass,
  Transaction,
} from '@repo/types';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    if (!userId) {
      throw new Error('userId is required');
    }

    const db = this.firebaseAdmin.getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() as User;
    const monthStartDate =
      (userData as User & { monthStartDate?: number })?.monthStartDate ?? 1;

    // 1. Fetch Accounts
    const accountsSnapshot = await db
      .collection('accounts')
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();

    // filter out accounts marked as excluded from analytics
    const accounts = (
      accountsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>),
      })) as unknown as Account[]
    ).filter((acc) => !acc.excludeFromAnalytics);

    // 2. Fetch Goals (for stats and pacing)
    const goalsSnapshot = await db
      .collection('goals')
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();
    const goals = goalsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, any>),
    })) as unknown as FinancialGoal[];

    // Calculate current stats
    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach((acc: Account) => {
      const balance = Number(acc.balance) || 0;
      if (balance > 0) {
        totalAssets += balance;
      } else {
        totalLiabilities += Math.abs(balance);
      }
    });

    // Add goal money to assets (if stored separately)
    goals.forEach((goal: FinancialGoal) => {
      totalAssets += Number(goal.currentAmount) || 0;
    });

    const netWorth = totalAssets - totalLiabilities;

    // 3. Asset Allocation
    const assetClassesSnapshot = await db
      .collection('assetClasses')
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();
    const assetClasses = assetClassesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, any>),
    })) as unknown as AssetClass[];

    const allocationMap = new Map<string, { value: number; color: string }>();

    accounts.forEach((acc) => {
      if (acc.balance > 0) {
        let className = 'Other';
        let color = '#94a3b8';

        if (acc.assetType) {
          const ac = assetClasses.find((c) => c.id === acc.assetType);
          if (ac) {
            className = ac.name;
            color = ac.color;
          }
        } else {
          className = acc.type.charAt(0).toUpperCase() + acc.type.slice(1);
        }

        const existing = allocationMap.get(className) || { value: 0, color };
        allocationMap.set(className, {
          value: existing.value + Number(acc.balance),
          color: existing.color,
        });
      }
    });

    const assetAllocation = Array.from(allocationMap.entries()).map(
      ([name, { value, color }]) => ({
        name,
        value,
        color,
      }),
    );

    // 4. Goal Pacing
    const goalPacing = goals.map((goal: FinancialGoal) => {
      const targetAmt = Number(goal.targetAmount) || 1;
      const currentAmt = Number(goal.currentAmount) || 0;
      const actualPercentage = Math.round(
        Math.min(100, (currentAmt / targetAmt) * 100),
      );

      const startDate = new Date(goal.startDate || new Date().toISOString());
      const targetDate = new Date(goal.targetDate);
      const totalDuration = targetDate.getTime() - startDate.getTime();
      const elapsed = Date.now() - startDate.getTime();
      const expectedPercentage = Math.round(
        Math.min(
          100,
          Math.max(
            0,
            totalDuration > 0 ? (elapsed / totalDuration) * 100 : 100,
          ),
        ),
      );

      return {
        goalId: goal.id,
        goalName: goal.name,
        actualPercentage,
        expectedPercentage,
        status:
          actualPercentage >= expectedPercentage
            ? ('ahead' as const)
            : ('behind' as const),
      };
    });

    // 5. Net Worth History (Last 6 months)
    const netWorthHistory: { month: string; value: number }[] = [];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    // Fetch all transactions since 6 months ago to calculate historical net worth accurately
    const sixMonthsAgo = this.getFiscalMonthStart(
      new Date(),
      Number(monthStartDate),
    );
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 full fiscal months + current

    const txSnapshot = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .where('status', '==', 'completed')
      .where('date', '>=', sixMonthsAgo.toISOString())
      .get();

    const allTransactions = txSnapshot.docs.map(
      (doc) => doc.data() as Transaction,
    );

    // Filter out transactions belonging to accounts excluded from analytics
    const excludedAccountIds = new Set(
      accountsSnapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...(doc.data() as Record<string, any>),
            }) as unknown as Account,
        )
        .filter((acc) => acc.excludeFromAnalytics)
        .map((acc) => acc.id),
    );

    const transactions = allTransactions.filter(
      (tx) => !excludedAccountIds.has(tx.accountId),
    );

    let rollingNetWorth = netWorth;

    for (let i = 0; i < 6; i++) {
      const d = this.getFiscalMonthStart(new Date(), Number(monthStartDate));
      d.setMonth(d.getMonth() - i);
      const monthName = months[d.getMonth()];

      // Calculate net worth at the end of this month
      // month_end_net_worth = current_net_worth - (net_change_since_that_month)
      // but easier is: we go backwards.
      // Net Worth for current month is `netWorth`.
      // For previous month: netWorth - sum(incomes this month) + sum(expenses this month).

      if (i === 0) {
        netWorthHistory.unshift({
          month: monthName ?? 'Jan',
          value: Math.round(netWorth),
        });
      } else {
        const targetMonthStart = this.getFiscalMonthStart(
          new Date(),
          Number(monthStartDate),
        );
        targetMonthStart.setMonth(targetMonthStart.getMonth() - i + 1);
        const thisMonthTxs = transactions.filter((tx) => {
          const txDate = new Date(tx.date);
          return txDate >= targetMonthStart;
        });

        // Calculate net change specifically affecting net worth
        let netChange = 0;
        thisMonthTxs.forEach((tx: Transaction) => {
          if (tx.type === 'income') netChange += Number(tx.amount);
          if (tx.type === 'expense') netChange -= Number(tx.amount);
          // Transfer between internal accounts/goals doesn't change net worth
        });

        rollingNetWorth -= netChange;
        netWorthHistory.unshift({
          month: monthName ?? 'Jan',
          value: Math.round(rollingNetWorth),
        });
      }
    }

    return {
      netWorth,
      totalAssets,
      totalLiabilities,
      netWorthHistory,
      assetAllocation,
      goalPacing,
    };
  }

  async getAdminStats(): Promise<AdminStats> {
    const db = this.firebaseAdmin.getFirestore();

    // Fetch real counts (only non-deleted users)
    const usersSnapshot = await db
      .collection('users')
      .where('deletedAt', '==', null)
      .get();

    // Filter non-admins in memory to bypass composite index requirement
    const userDocs = usersSnapshot.docs.filter(
      (doc) => (doc.data() as User).role !== 'admin',
    );

    const validUserIds = new Set(userDocs.map((doc) => doc.id));
    const totalUsers = userDocs.length;

    const accountsSnapshot = await db
      .collection('accounts')
      .where('deletedAt', '==', null)
      .get();
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

    // Fetch real recent activities (only non-deleted users)
    // We filter non-admins and sort in memory
    const recentActivities: AdminStats['recentActivities'] = userDocs
      .sort((a, b) => {
        const catA = (a.data() as User).createdAt || '';
        const catB = (b.data() as User).createdAt || '';
        return catB.localeCompare(catA);
      })
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

    // Calculate real user growth for last 7 days (non-admin, non-deleted)
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
        const userData = doc.data() as User;
        const createdAt = userData.createdAt;
        if (!createdAt) return false;
        const createdDate = new Date(createdAt);
        return createdDate >= dayStart && createdDate <= dayEnd;
      }).length;

      last7Days.push({ day: dayName ?? 'Unknown', count });
    }

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeUsers24h = userDocs.filter((doc) => {
      const userData = doc.data() as User;
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

  private getFiscalMonthStart(date: Date, startDay: number): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (d.getDate() < startDay) {
      d.setMonth(d.getMonth() - 1);
    }
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(startDay, lastDay));
    return d;
  }
}
