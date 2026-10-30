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

  async findOne(id: string, userId?: string): Promise<Account> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists || doc.data()?.deletedAt) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    const data = { id: doc.id, ...doc.data() } as Account;
    if (userId && data.userId !== userId) {
      throw new ForbiddenException('Access denied to this account');
    }
    return data;
  }

  async create(account: Partial<Account>): Promise<Account> {
    let initialAmount =
      account.initialAmount !== undefined
        ? Number(account.initialAmount)
        : Number(account.balance) || 0;
    let balance = Number(account.balance) || 0;
    const repaidCapital = Number(account.repaidCapital) || 0;
    const burnedInterest = Number(account.burnedInterest) || 0;

    if (account.type === 'debt') {
      const totalLoan =
        initialAmount > 0 ? initialAmount : Math.abs(balance) + repaidCapital;
      initialAmount = totalLoan;
      const remainingDebt = Math.max(0, totalLoan - repaidCapital);
      balance = -remainingDebt;
    }

    const investedAmount =
      account.investedAmount !== undefined
        ? Number(account.investedAmount)
        : account.type === 'investment'
          ? Number(account.balance) || 0
          : undefined;

    const docRef = await this.collection.add({
      ...account,
      initialAmount,
      balance,
      repaidCapital,
      burnedInterest,
      ...(investedAmount !== undefined ? { investedAmount } : {}),
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

  async update(
    id: string,
    account: Partial<Account>,
    userId?: string,
  ): Promise<Account> {
    const currentAccount = await this.findOne(id, userId);

    // Dedicated handler for loans/liabilities: always compute remaining balance directly
    if (currentAccount.type === 'debt') {
      const totalLoan =
        account.initialAmount !== undefined
          ? Number(account.initialAmount)
          : Number(currentAccount.initialAmount) || 0;
      const repaid =
        account.repaidCapital !== undefined
          ? Number(account.repaidCapital)
          : Number(currentAccount.repaidCapital) || 0;
      const interest =
        account.burnedInterest !== undefined
          ? Number(account.burnedInterest)
          : Number(currentAccount.burnedInterest) || 0;
      const remainingDebt = Math.max(0, totalLoan - repaid);

      await this.collection.doc(id).update({
        ...account,
        initialAmount: totalLoan,
        repaidCapital: repaid,
        burnedInterest: interest,
        balance: -remainingDebt,
        lastSyncedAt: new Date().toISOString(),
      });

      const updatedAccount = await this.findOne(id);

      // Log activity
      await this.activityLogService.logActivity({
        userId: updatedAccount.userId,
        action: 'update',
        entityType: 'account',
        entityId: id,
        description: `Updated loan/liability: ${updatedAccount.name}`,
        metadata: { updateData: account },
        previousState: currentAccount,
        newState: updatedAccount,
      });

      return updatedAccount;
    }

    const newBalance =
      account.balance !== undefined ? Number(account.balance) : undefined;

    // If balance is being manually updated
    if (
      newBalance !== undefined &&
      Math.abs(newBalance - (currentAccount.balance || 0)) > 0.01
    ) {
      const skipTraction = ['investment', 'asset'].includes(
        currentAccount.type,
      );

      if (skipTraction) {
        // For Investment/Asset, we avoid creating a "traction" transaction.
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
          await this.transactionsService.recalculateBalances(id);
        } else {
          // For Asset, we adjust initialAmount
          const delta = newBalance - (currentAccount.balance || 0);
          const newInitial = (currentAccount.initialAmount || 0) + delta;

          await this.collection.doc(id).update({
            ...updateData,
            initialAmount: newInitial,
            lastSyncedAt: new Date().toISOString(),
          });
          await this.transactionsService.recalculateBalances(id);
        }
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

  async remove(id: string, userId?: string): Promise<void> {
    const account = await this.findOne(id, userId);
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
      } else if (acc.type === 'debt') {
        const repaid = Number(acc.repaidCapital) || 0;
        const totalLoan =
          Number(acc.initialAmount) || Math.abs(newBalance) + repaid;
        updateData.initialAmount = totalLoan;
        updateData.balance = -Math.abs(newBalance);
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

    // 1. Fetch current accounts - strictly Liquid Cash & Bank accounts only
    const accounts = await this.findAll(userId);
    const liquidAccounts = accounts.filter(
      (a) =>
        !a.isClosed &&
        !a.excludeFromAnalytics &&
        (a.type === 'bank' || a.type === 'cash'),
    );

    let bankBalance = 0;
    let cashBalance = 0;

    for (const a of liquidAccounts) {
      const bal = Number(a.balance) || 0;
      if (a.type === 'bank') {
        bankBalance += Math.max(0, bal);
      } else if (a.type === 'cash') {
        cashBalance += Math.max(0, bal);
      }
    }

    const liquidBalance = bankBalance + cashBalance;

    // 2. Fetch historical snapshots & extract liquid accounts changes
    const snapshots = await this.getSnapshots(userId, 5);
    const sortedDesc = [...snapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    let liquidDelta = 0;
    let percentageDelta = 0;
    let topGainer: MonthlyDebrief['topGainer'] = null;
    let topLeak: MonthlyDebrief['topLeak'] = null;
    const hasSufficientData = sortedDesc.length > 0;

    const latest = sortedDesc[0];

    let pulseInflow = 0;
    let pulseOutflow = 0;

    if (
      latest &&
      latest.accountSnapshots &&
      latest.accountSnapshots.length > 0
    ) {
      // Filter account snapshots to liquid only (bank + cash)
      const liquidSnapshots = latest.accountSnapshots.filter(
        (s) => s.type === 'bank' || s.type === 'cash',
      );

      liquidDelta = liquidSnapshots.reduce(
        (sum, s) => sum + (Number(s.delta) || 0),
        0,
      );

      const gainers = liquidSnapshots
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
      pulseInflow = gainers.reduce((sum, s) => sum + s.delta, 0);

      const decliners = liquidSnapshots
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
      pulseOutflow = decliners.reduce((sum, s) => sum + Math.abs(s.delta), 0);
    }

    // Check transactions in the current month for active cash flow
    const firestore = this.firebaseAdmin.getFirestore();
    const currentFiscalStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const txSnapshot = await firestore
      .collection('transactions')
      .where('userId', '==', userId)
      .where('date', '>=', currentFiscalStart.toISOString().split('T')[0])
      .get();

    let txInflow = 0;
    let txOutflow = 0;
    for (const doc of txSnapshot.docs) {
      const tx = doc.data();
      if (tx.deletedAt || tx.status === 'pending_confirmation') continue;
      if (tx.type === 'income') txInflow += Number(tx.amount) || 0;
      if (tx.type === 'expense') txOutflow += Number(tx.amount) || 0;
    }

    const inflow = txInflow > 0 || txOutflow > 0 ? txInflow : pulseInflow;
    const outflow = txInflow > 0 || txOutflow > 0 ? txOutflow : pulseOutflow;
    const netCashFlow = inflow - outflow;
    const savingsRate =
      inflow > 0
        ? Math.max(-100, Math.min(100, (netCashFlow / inflow) * 100))
        : 0;

    const baseLiquid = liquidBalance - liquidDelta;
    percentageDelta = baseLiquid > 0 ? (liquidDelta / baseLiquid) * 100 : 0;

    // 3. Executive Insight
    let insight = `₹${liquidBalance.toLocaleString()} liquid reserves across ${liquidAccounts.length} accounts.`;
    if (liquidDelta > 0) {
      insight = `+₹${Math.abs(liquidDelta).toLocaleString()} (+${percentageDelta.toFixed(1)}%) expansion. ${topGainer ? `${topGainer.accountName} led inflows.` : 'Disciplined preservation.'}`;
    } else if (liquidDelta < 0) {
      insight = `-₹${Math.abs(liquidDelta).toLocaleString()} (-${Math.abs(percentageDelta).toFixed(1)}%) outflow. ${topLeak ? `${topLeak.accountName} saw largest drop.` : ''}`;
    }

    return {
      period,
      netWorth: liquidBalance,
      netWorthDelta: liquidDelta,
      percentageDelta,
      inflow,
      outflow,
      netCashFlow,
      savingsRate: Number(savingsRate.toFixed(1)),
      topGainer,
      topLeak,
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
