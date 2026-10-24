import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import {
  Account,
  TransactionType,
  BatchSyncAccountsDto,
  WealthSnapshot,
  AccountSnapshotItem,
  MonthlyDebrief,
  LeakageAlert,
} from '@repo/types';
import { TransactionsService } from './transactions.service';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class AccountsService {
  private readonly collectionName = 'accounts';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly transactionsService: TransactionsService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async findAll(userId: string): Promise<Account[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Account)
      .filter((account) => !account.deletedAt);
  }

  async findOne(id: string): Promise<Account> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists || doc.data()?.deletedAt) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as Account;
  }

  async create(account: Partial<Account>): Promise<Account> {
    const initialAmount = Number(account.balance) || 0;
    const docRef = await this.collection.add({
      ...account,
      initialAmount,
      deletedAt: null,
      lastSyncedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    const result = { id: doc.id, ...doc.data() } as Account;

    // Log activity
    await this.activityLogService.logActivity({
      userId: result.userId,
      action: 'create',
      entityType: 'account',
      entityId: doc.id,
      description: `Created account: ${result.name} (${result.type})`,
      metadata: { balance: result.balance, type: result.type },
    });

    return result;
  }

  async update(id: string, account: Partial<Account>): Promise<Account> {
    const currentAccount = await this.findOne(id);
    const newBalance =
      account.balance !== undefined ? Number(account.balance) : undefined;

    // If balance is being manually updated
    if (
      newBalance !== undefined &&
      Math.abs(newBalance - (currentAccount.balance || 0)) > 0.01
    ) {
      const skipTraction = ['investment', 'debt', 'asset'].includes(
        currentAccount.type,
      );

      if (skipTraction) {
        // For Investment/Debt/Asset, we avoid creating a "traction" transaction.
        // Instead, we adjust the valuationAdjustment (for investments) or initialAmount (for others)
        // so that recalculateBalances results in the target balance.

        const updateData = { ...account };
        delete updateData.balance;

        if (currentAccount.type === 'investment') {
          // Calculate existing tx-derived balance (without current adjustment)
          // We'll just update the valuationAdjustment to be the delta from the current total balance
          const existingAdj = Number(currentAccount.valuationAdjustment) || 0;
          const delta = newBalance - (currentAccount.balance || 0);
          const newAdj = existingAdj + delta;

          await this.collection.doc(id).update({
            ...updateData,
            valuationAdjustment: newAdj,
            lastSyncedAt: new Date().toISOString(),
          });
        } else {
          // For Debt/Asset, we adjust initialAmount
          const delta = newBalance - (currentAccount.balance || 0);
          const newInitial = (currentAccount.initialAmount || 0) + delta;

          await this.collection.doc(id).update({
            ...updateData,
            initialAmount: newInitial,
            lastSyncedAt: new Date().toISOString(),
          });
        }

        // Trigger recalculation to ensure everything is consistent
        await this.transactionsService.recalculateBalances(id);
      } else {
        // For Bank/Cash/Card, we preserve the "traction" adjustment transaction logic
        const delta = newBalance - (currentAccount.balance || 0);
        const type: TransactionType = delta > 0 ? 'income' : 'expense';

        // For cards, manual increase in balance is income (paid off debt).

        await this.transactionsService.create({
          userId: currentAccount.userId,
          accountId: id,
          amount: Math.abs(delta),
          type: type,
          category: 'Valuation Adjustment',
          description: `Manual adjustment to match ${newBalance.toLocaleString()} valuation`,
          date: new Date().toISOString(),
          status: 'completed',
          metadata: {
            isSystemAdjustment: true,
            previousBalance: currentAccount.balance,
            newBalance: newBalance,
          },
        });

        const updateData = { ...account };
        delete updateData.balance;
        await this.collection.doc(id).update({
          ...updateData,
          lastSyncedAt: new Date().toISOString(),
        });
      }
    } else {
      await this.collection.doc(id).update({
        ...account,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    const updatedAccount = await this.findOne(id);

    // Log activity
    await this.activityLogService.logActivity({
      userId: updatedAccount.userId,
      action: 'update',
      entityType: 'account',
      entityId: id,
      description: `Updated account: ${updatedAccount.name}`,
      metadata: { updateData: account },
      previousState: currentAccount,
      newState: updatedAccount,
    });

    return updatedAccount;
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    // Cascade soft-delete transactions related to this account
    await this.transactionsService.removeByAccountId(id);
    // Soft-delete the account itself
    await this.collection.doc(id).update({
      deletedAt: new Date().toISOString(),
    });

    // Log activity
    await this.activityLogService.logActivity({
      userId: account.userId,
      action: 'delete',
      entityType: 'account',
      entityId: id,
      description: `Deleted account: ${account.name}`,
    });
  }

  /**
   * BATCH SYNC: Updates multiple account balances in a single atomic transaction
   * and generates a point-in-time WealthSnapshot for instant monthly tracking.
   */
  async batchSync(
    userId: string,
    dto: BatchSyncAccountsDto,
  ): Promise<{ updatedAccounts: Account[]; snapshot: WealthSnapshot }> {
    const firestore = this.firebaseAdmin.getFirestore();
    const batch = firestore.batch();
    const now = dto.timestamp || new Date().toISOString();
    const today = now.split('T')[0] || now;

    const existingAccounts = await this.findAll(userId);
    const previousBalances = new Map<string, number>();
    let previousTotalAssets = 0;
    let previousTotalLiabilities = 0;

    existingAccounts.forEach((a) => {
      const bal = Number(a.balance) || 0;
      previousBalances.set(a.id, bal);
      if (['debt', 'card'].includes(a.type)) {
        previousTotalLiabilities += Math.abs(bal);
      } else {
        previousTotalAssets += Math.max(0, bal);
      }
    });
    const previousNetWorth = previousTotalAssets - previousTotalLiabilities;

    const accountMap = new Map(existingAccounts.map((a) => [a.id, a]));
    const updatedAccounts: Account[] = [];

    for (const item of dto.accounts) {
      const acc = accountMap.get(item.accountId);
      if (!acc) continue;

      const newBalance = Number(item.balance);
      if (isNaN(newBalance)) continue;

      const delta = newBalance - (acc.balance || 0);
      const docRef = this.collection.doc(acc.id);

      const updateData: Record<string, any> = {
        balance: newBalance,
        lastSyncedAt: now,
      };

      if (acc.type === 'investment') {
        const existingAdj = Number(acc.valuationAdjustment) || 0;
        updateData.valuationAdjustment = existingAdj + delta;
      } else {
        const newInitial = (acc.initialAmount || 0) + delta;
        updateData.initialAmount = newInitial;
      }

      batch.update(docRef, updateData);
      const updatedAcc = { ...acc, ...updateData };
      updatedAccounts.push(updatedAcc);
      accountMap.set(acc.id, updatedAcc);
    }

    // Compute Wealth Snapshot
    let totalAssets = 0;
    let totalLiabilities = 0;
    let liquidCapital = 0;
    let investedCapital = 0;

    const allCurrentAccounts = Array.from(accountMap.values());
    const accountSnapshots: AccountSnapshotItem[] = allCurrentAccounts.map(
      (a) => {
        const bal = Number(a.balance) || 0;
        const prevBal = previousBalances.get(a.id) ?? bal;
        const delta = bal - prevBal;

        if (['debt', 'card'].includes(a.type)) {
          totalLiabilities += Math.abs(bal);
        } else {
          totalAssets += Math.max(0, bal);
          if (['bank', 'cash'].includes(a.type)) {
            liquidCapital += Math.max(0, bal);
          } else if (a.type === 'investment') {
            investedCapital += Math.max(0, bal);
          }
        }
        return {
          accountId: a.id,
          accountName: a.name,
          type: a.type,
          previousBalance: prevBal,
          balance: bal,
          delta,
        };
      },
    );

    const netWorth = totalAssets - totalLiabilities;
    const netWorthDelta = netWorth - previousNetWorth;

    const snapshotRef = firestore.collection('wealth_snapshots').doc();
    const snapshot: WealthSnapshot = {
      id: snapshotRef.id,
      userId,
      date: today,
      netWorth,
      previousNetWorth,
      netWorthDelta,
      totalAssets,
      totalLiabilities,
      liquidCapital,
      investedCapital,
      accountSnapshots,
      note: dto.note || 'Monthly Wealth Pulse',
      createdAt: now,
    };

    batch.set(snapshotRef, snapshot);
    await batch.commit();

    await this.activityLogService.logActivity({
      userId,
      action: 'update',
      entityType: 'account',
      description: `Wealth Pulse: Updated ${updatedAccounts.length} accounts. Net Worth: ₹${netWorth.toLocaleString()}`,
      metadata: {
        accountsUpdated: updatedAccounts.length,
        netWorth,
        totalAssets,
        totalLiabilities,
      },
    });

    return { updatedAccounts, snapshot };
  }

  async getSnapshots(
    userId: string,
    limitCount = 12,
  ): Promise<WealthSnapshot[]> {
    const firestore = this.firebaseAdmin.getFirestore();
    const snapshot = await firestore
      .collection('wealth_snapshots')
      .where('userId', '==', userId)
      .limit(limitCount)
      .get();

    const items = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as WealthSnapshot,
    );
    return items.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  async deleteSnapshot(
    userId: string,
    snapshotId: string,
  ): Promise<{ success: boolean; id: string; revertedAccounts: Account[] }> {
    const firestore = this.firebaseAdmin.getFirestore();
    const docRef = firestore.collection('wealth_snapshots').doc(snapshotId);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Wealth snapshot not found');
    }
    const data = doc.data() as WealthSnapshot;
    if (data?.userId !== userId) {
      throw new ForbiddenException('Unauthorized to delete this snapshot');
    }

    const batch = firestore.batch();
    const revertedAccounts: Account[] = [];

    // Revert actual account balances to their baseline state prior to this pulse
    if (data.accountSnapshots && Array.isArray(data.accountSnapshots)) {
      const existingAccounts = await this.findAll(userId);
      const accMap = new Map(existingAccounts.map((a) => [a.id, a]));

      for (const item of data.accountSnapshots) {
        const acc = accMap.get(item.accountId);
        if (!acc || item.previousBalance === undefined) continue;

        const targetBalance = Number(item.previousBalance) || 0;
        const currentBalance = Number(acc.balance) || 0;
        const delta = targetBalance - currentBalance;
        const accDocRef = this.collection.doc(acc.id);

        const updateData: Record<string, any> = {
          balance: targetBalance,
          lastSyncedAt: new Date().toISOString(),
        };

        if (acc.type === 'investment') {
          const existingAdj = Number(acc.valuationAdjustment) || 0;
          updateData.valuationAdjustment = existingAdj + delta;
        } else {
          const newInitial = (acc.initialAmount || 0) + delta;
          updateData.initialAmount = newInitial;
        }

        batch.update(accDocRef, updateData);
        revertedAccounts.push({ ...acc, ...updateData });
      }
    }

    batch.delete(docRef);
    await batch.commit();

    return { success: true, id: snapshotId, revertedAccounts };
  }

  async updateSnapshot(
    userId: string,
    snapshotId: string,
    dto: { note?: string; accountBalances?: Record<string, number> },
  ): Promise<{ snapshot: WealthSnapshot; updatedAccounts: Account[] }> {
    const firestore = this.firebaseAdmin.getFirestore();
    const docRef = firestore.collection('wealth_snapshots').doc(snapshotId);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Wealth snapshot not found');
    }
    const data = doc.data() as WealthSnapshot;
    if (data.userId !== userId) {
      throw new ForbiddenException('Unauthorized to edit this snapshot');
    }

    const batch = firestore.batch();
    const updateData: Partial<WealthSnapshot> = {};
    const updatedAccounts: Account[] = [];
    const now = new Date().toISOString();

    if (dto.note !== undefined) {
      updateData.note = dto.note;
    }

    if (dto.accountBalances && data.accountSnapshots) {
      const existingAccounts = await this.findAll(userId);
      const accMap = new Map(existingAccounts.map((a) => [a.id, a]));

      const updatedAccountSnapshots = data.accountSnapshots.map((accSnap) => {
        if (
          dto.accountBalances &&
          dto.accountBalances[accSnap.accountId] !== undefined
        ) {
          const newBalance =
            Number(dto.accountBalances[accSnap.accountId]) || 0;
          const prevBal = Number(accSnap.previousBalance ?? accSnap.balance);

          // Also update the actual account in Firestore
          const actualAcc = accMap.get(accSnap.accountId);
          if (actualAcc) {
            const currentActualBalance = Number(actualAcc.balance) || 0;
            const delta = newBalance - currentActualBalance;
            const accDocRef = this.collection.doc(actualAcc.id);

            const accUpdateData: Record<string, any> = {
              balance: newBalance,
              lastSyncedAt: now,
            };

            if (actualAcc.type === 'investment') {
              const existingAdj = Number(actualAcc.valuationAdjustment) || 0;
              accUpdateData.valuationAdjustment = existingAdj + delta;
            } else {
              const newInitial = (actualAcc.initialAmount || 0) + delta;
              accUpdateData.initialAmount = newInitial;
            }

            batch.update(accDocRef, accUpdateData);
            updatedAccounts.push({ ...actualAcc, ...accUpdateData });
          }

          return {
            ...accSnap,
            balance: newBalance,
            delta: newBalance - prevBal,
          };
        }
        return accSnap;
      });

      let totalAssets = 0;
      let totalLiabilities = 0;
      let liquidCapital = 0;
      let investedCapital = 0;

      for (const acc of updatedAccountSnapshots) {
        const bal = Number(acc.balance) || 0;
        if (['debt', 'card'].includes(acc.type)) {
          totalLiabilities += Math.abs(bal);
        } else {
          totalAssets += Math.max(0, bal);
          if (['bank', 'cash'].includes(acc.type)) {
            liquidCapital += Math.max(0, bal);
          } else if (acc.type === 'investment' || acc.type === 'asset') {
            investedCapital += Math.max(0, bal);
          }
        }
      }

      const netWorth = totalAssets - totalLiabilities;
      const prevNW = Number(data.previousNetWorth ?? 0);
      const netWorthDelta = netWorth - prevNW;

      updateData.accountSnapshots = updatedAccountSnapshots;
      updateData.totalAssets = totalAssets;
      updateData.totalLiabilities = totalLiabilities;
      updateData.liquidCapital = liquidCapital;
      updateData.investedCapital = investedCapital;
      updateData.netWorth = netWorth;
      updateData.netWorthDelta = netWorthDelta;
    }

    batch.update(docRef, updateData);
    await batch.commit();

    const snapshotResult = { ...data, ...updateData };
    return { snapshot: snapshotResult, updatedAccounts };
  }

  async getMonthlyDebrief(userId: string): Promise<MonthlyDebrief> {
    const now = new Date();
    const period = now.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // 1. Fetch current accounts
    const accounts = await this.findAll(userId);
    const activeAccounts = accounts.filter(
      (a) => !a.isClosed && !a.excludeFromAnalytics,
    );

    let totalAssets = 0;
    let totalLiabilities = 0;
    let liquidCapital = 0;
    let investedCapital = 0;

    for (const a of activeAccounts) {
      const bal = Number(a.balance) || 0;
      if (['debt', 'card'].includes(a.type)) {
        totalLiabilities += Math.abs(bal);
      } else {
        totalAssets += Math.max(0, bal);
        if (['bank', 'cash'].includes(a.type)) {
          liquidCapital += Math.max(0, bal);
        } else if (a.type === 'investment' || a.type === 'asset') {
          investedCapital += Math.max(0, bal);
        }
      }
    }

    const currentNetWorth = totalAssets - totalLiabilities;

    // 2. Fetch historical snapshots
    const snapshots = await this.getSnapshots(userId, 5);
    const sortedDesc = [...snapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    let netWorthDelta = 0;
    let percentageDelta = 0;
    let topGainer: MonthlyDebrief['topGainer'] = null;
    let topLeak: MonthlyDebrief['topLeak'] = null;
    const hasSufficientData = sortedDesc.length > 0;

    const latest = sortedDesc[0];
    const previous = sortedDesc[1];

    if (latest) {
      netWorthDelta =
        latest.netWorthDelta ??
        latest.netWorth - (previous ? previous.netWorth : latest.netWorth);
      const baseNW = previous
        ? previous.netWorth
        : (latest.previousNetWorth ?? latest.netWorth);
      percentageDelta =
        baseNW && baseNW > 0 ? (netWorthDelta / baseNW) * 100 : 0;

      // Extract top gainer and top leak from latest account snapshots
      if (latest.accountSnapshots && latest.accountSnapshots.length > 0) {
        const gainers = latest.accountSnapshots
          .filter((s) => s.delta > 0)
          .sort((a, b) => b.delta - a.delta);
        const firstGainer = gainers[0];
        if (firstGainer) {
          topGainer = {
            accountId: firstGainer.accountId,
            accountName: firstGainer.accountName,
            delta: firstGainer.delta,
            type: firstGainer.type,
          };
        }

        const decliners = latest.accountSnapshots
          .filter((s) => s.delta < 0)
          .sort((a, b) => a.delta - b.delta);
        const firstDecliner = decliners[0];
        if (firstDecliner) {
          topLeak = {
            accountId: firstDecliner.accountId,
            accountName: firstDecliner.accountName,
            delta: firstDecliner.delta,
            type: firstDecliner.type,
          };
        }
      }
    }

    // Fallback for topLeak if no negative delta: check if largest debt exists
    if (!topLeak && totalLiabilities > 0) {
      const debts = activeAccounts
        .filter((a) => ['debt', 'card'].includes(a.type))
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
      const largestDebt = debts[0];
      if (largestDebt) {
        topLeak = {
          accountId: largestDebt.id,
          accountName: largestDebt.name,
          delta: -Math.abs(largestDebt.balance),
          type: largestDebt.type,
        };
      }
    }

    // 3. Build Leakage Alerts / Heuristics
    const alerts: LeakageAlert[] = [];

    if (totalLiabilities > 0) {
      alerts.push({
        id: 'liabilities',
        type: 'warning',
        title: 'Active Liabilities',
        message: `Outstanding card & loan obligations stand at ₹${totalLiabilities.toLocaleString()}. Prioritize paying these down to avoid compounding interest drag.`,
        impactAmount: totalLiabilities,
      });
    }

    if (
      totalAssets > 0 &&
      liquidCapital / totalAssets > 0.4 &&
      liquidCapital > 100000
    ) {
      alerts.push({
        id: 'cash-drag',
        type: 'opportunity',
        title: 'Cash Drag Identified',
        message: `${Math.round((liquidCapital / totalAssets) * 100)}% of your capital is in liquid cash (₹${liquidCapital.toLocaleString()}). Moving a portion to investments could yield higher compounding returns.`,
        impactAmount: Math.round(liquidCapital * 0.08),
      });
    }

    if (netWorthDelta > 0) {
      alerts.push({
        id: 'growth-win',
        type: 'achievement',
        title: 'Positive Net Worth Expansion',
        message: `Your balance grew by +₹${Math.abs(netWorthDelta).toLocaleString()} (+${percentageDelta.toFixed(1)}%) in your latest recorded pulse.`,
        impactAmount: netWorthDelta,
      });
    }

    // 4. Executive Insight
    let insight = `Your Net Worth is ₹${currentNetWorth.toLocaleString()} across ${activeAccounts.length} active nodes.`;
    if (netWorthDelta > 0) {
      insight = `Net Worth expanded by ₹${Math.abs(netWorthDelta).toLocaleString()} (+${percentageDelta.toFixed(1)}%). ${topGainer ? `${topGainer.accountName} led growth.` : 'Disciplined progress!'}`;
    } else if (netWorthDelta < 0) {
      insight = `Net Worth dipped by ₹${Math.abs(netWorthDelta).toLocaleString()} this check-in. Review recent expenses or market pullbacks.`;
    }

    return {
      period,
      netWorth: currentNetWorth,
      netWorthDelta,
      percentageDelta,
      topGainer,
      topLeak,
      allocation: {
        liquid: liquidCapital,
        invested: investedCapital,
        debt: totalLiabilities,
      },
      alerts,
      insight,
      hasSufficientData,
    };
  }

  async getPulseSchedule(
    userId: string,
  ): Promise<{ cadence: string; targetDay: number; nextPulseDate: string }> {
    const userDoc = await this.firebaseAdmin
      .getFirestore()
      .collection('users')
      .doc(userId)
      .get();
    const userData = userDoc.data();
    const targetDay = Number(userData?.monthStartDate) || 1;
    const cadence = (userData?.pulseCadence as string) || 'monthly';

    const now = new Date();
    let nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
    if (now.getDate() >= targetDay) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
    }

    return {
      cadence,
      targetDay,
      nextPulseDate: nextDate.toISOString().split('T')[0] ?? '',
    };
  }

  async updatePulseSchedule(
    userId: string,
    data: { cadence?: string; targetDay?: number },
  ): Promise<{ success: boolean; nextPulseDate: string }> {
    const userRef = this.firebaseAdmin
      .getFirestore()
      .collection('users')
      .doc(userId);
    const updates: Record<string, unknown> = {};
    if (data.cadence) updates.pulseCadence = data.cadence;
    if (data.targetDay !== undefined)
      updates.monthStartDate = Number(data.targetDay);

    await userRef.set(updates, { merge: true });

    const schedule = await this.getPulseSchedule(userId);
    return {
      success: true,
      nextPulseDate: schedule.nextPulseDate,
    };
  }
}
