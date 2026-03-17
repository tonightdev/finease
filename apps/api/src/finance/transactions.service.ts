import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { Transaction, Account, FinancialGoal } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';

// =============================================================================
// TransactionsService
//
// All balance mutations MUST go through recalculateBalances().
// Never update account.balance directly outside of that method.
// See TRANSACTION_LOGIC.md for full design documentation.
// =============================================================================

@Injectable()
export class TransactionsService {
  private readonly collectionName = 'transactions';
  private readonly accountsCollection = 'accounts';
  private readonly goalsCollection = 'goals';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get db() {
    return this.firebaseAdmin.getFirestore();
  }

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Returns the next occurrence date based on a recurring frequency. */
  private calculateNextDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date.toISOString();
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async findAll(userId: string): Promise<Transaction[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
      .filter((tx) => !tx.deletedAt)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async findOne(id: string): Promise<Transaction> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists || doc.data()?.deletedAt) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as Transaction;
  }

  async create(transaction: Partial<Transaction>): Promise<Transaction> {
    if (!transaction.accountId) {
      throw new Error('accountId is required');
    }

    const txRef = this.collection.doc();

    // A transaction with a destination account is always a transfer.
    const effectiveType = transaction.toAccountId
      ? 'transfer'
      : (transaction.type ?? 'expense');

    // Automated transactions start as pending_confirmation.
    const status =
      transaction.status ??
      (transaction.isAutomated ? 'pending_confirmation' : 'completed');

    const amount = Number(transaction.amount) || 0;
    const interestAmount = Number(transaction.interestAmount) || 0;
    this.validateInterestAmount(amount, interestAmount);

    await txRef.set({
      ...transaction,
      id: txRef.id,
      type: effectiveType,
      status,
      date: transaction.date ?? new Date().toISOString(),
      deletedAt: null,
    });

    // Trigger recalculation after persisting.
    if (status === 'completed' || status === 'approved') {
      await this.recalculateBalances(transaction.accountId);
      if (transaction.toAccountId) {
        await this.recalculateBalances(transaction.toAccountId);
        await this.recalculateGoalProgress(transaction.toAccountId);
      }
    }

    // Log the activity
    await this.activityLogService.logActivity({
      userId: transaction.userId!,
      action: 'create',
      entityType: 'transaction',
      entityId: txRef.id,
      description: `Created ${effectiveType} transaction: ${transaction.description}`,
      metadata: { amount, type: effectiveType },
    });

    return (await txRef.get()).data() as Transaction;
  }

  async update(
    id: string,
    updateData: Partial<Transaction>,
  ): Promise<Transaction> {
    const oldTx = await this.findOne(id);
    const txRef = this.collection.doc(id);

    // Re-evaluate whether this is a transfer based on merged state.
    const effectiveType =
      (updateData.toAccountId ?? oldTx.toAccountId)
        ? 'transfer'
        : (updateData.type ?? oldTx.type);

    const mergedTx = { ...oldTx, ...updateData };
    this.validateInterestAmount(
      Number(mergedTx.amount),
      Number(mergedTx.interestAmount),
    );

    await txRef.update({
      ...updateData,
      type: effectiveType,
      lastSyncedAt: new Date().toISOString(),
    });

    // Recalculate all accounts that were or are now involved.
    const affectedAccounts = new Set<string>([
      ...([oldTx.accountId, oldTx.toAccountId].filter(Boolean) as string[]),
      ...([updateData.accountId, updateData.toAccountId].filter(
        Boolean,
      ) as string[]),
    ]);
    const affectedGoals = new Set<string>([
      ...([oldTx.toAccountId, updateData.toAccountId].filter(
        Boolean,
      ) as string[]),
    ]);

    for (const accId of affectedAccounts) {
      await this.recalculateBalances(accId);
    }
    for (const goalId of affectedGoals) {
      await this.recalculateGoalProgress(goalId);
    }

    const updatedTx = await this.findOne(id);

    // Log the activity
    await this.activityLogService.logActivity({
      userId: oldTx.userId,
      action: 'update',
      entityType: 'transaction',
      entityId: id,
      description: `Updated transaction: ${updateData.description || oldTx.description}`,
      metadata: { updateData },
      previousState: oldTx,
      newState: updatedTx,
    });

    return updatedTx;
  }

  async remove(id: string): Promise<void> {
    const txDoc = await this.collection.doc(id).get();
    if (!txDoc.exists) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const txData = txDoc.data() as Transaction;
    await this.collection
      .doc(id)
      .update({ deletedAt: new Date().toISOString() });

    if (txData.status === 'completed' || txData.status === 'approved') {
      await this.recalculateBalances(txData.accountId);
      if (txData.toAccountId) {
        await this.recalculateBalances(txData.toAccountId);
        await this.recalculateGoalProgress(txData.toAccountId);
      }
    }

    // Log the activity
    await this.activityLogService.logActivity({
      userId: txData.userId,
      action: 'delete',
      entityType: 'transaction',
      entityId: id,
      description: `Deleted transaction: ${txData.description}`,
      metadata: { amount: txData.amount },
    });
  }

  async removeByAccountId(accountId: string): Promise<void> {
    const snapshot = await this.collection
      .where('accountId', '==', accountId)
      .where('deletedAt', '==', null)
      .get();

    const batch = this.db.batch();
    const now = new Date().toISOString();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { deletedAt: now }));
    await batch.commit();
  }

  async confirm(id: string): Promise<Transaction> {
    const txDoc = await this.collection.doc(id).get();
    if (!txDoc.exists) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const txData = txDoc.data() as Transaction;
    const batch = this.db.batch();

    batch.update(this.collection.doc(id), { status: 'completed' });

    // If recurring, schedule the next occurrence.
    if (txData.isAutomated && txData.frequency) {
      const remaining = Number(txData.recurringCount);
      if (!isNaN(remaining) && remaining > 1) {
        const nextDate = this.calculateNextDate(txData.date, txData.frequency);
        const existing = await this.collection
          .where('userId', '==', txData.userId)
          .where('accountId', '==', txData.accountId)
          .where('description', '==', txData.description)
          .where('date', '==', nextDate)
          .limit(1)
          .get();

        if (existing.empty) {
          const nextRef = this.collection.doc();
          batch.set(nextRef, {
            ...txData,
            id: nextRef.id,
            date: nextDate,
            status: 'pending_confirmation',
            recurringCount: remaining - 1,
          });
        }
      }
    }

    await batch.commit();

    await this.recalculateBalances(txData.accountId);
    if (txData.toAccountId) {
      await this.recalculateBalances(txData.toAccountId);
      await this.recalculateGoalProgress(txData.toAccountId);
    }
    const updatedTx = { ...txData, status: 'completed' } as Transaction;

    // Log the activity
    await this.activityLogService.logActivity({
      userId: txData.userId,
      action: 'update',
      entityType: 'transaction',
      entityId: id,
      description: `Confirmed automated transaction: ${txData.description}`,
      metadata: { status: 'completed' },
      previousState: txData,
      newState: updatedTx,
    });

    return updatedTx;
  }

  /**
   * Validates that the interest portion of a transaction is not greater than the total amount.
   * Throws BadRequestException if validation fails.
   */
  private validateInterestAmount(amount: number, interestAmount?: number) {
    if (
      interestAmount !== undefined &&
      interestAmount !== null &&
      interestAmount > amount
    ) {
      throw new BadRequestException(
        `Interest portion (₹${interestAmount}) cannot be greater than total amount (₹${amount})`,
      );
    }
  }

  /**
   * RECALCULATION ENGINE
   *
   * Replays the full chronological transaction history for an account starting from
   * its initialAmount, ensuring the balance summary is mathematically consistent.
   */
  public async recalculateBalances(accountId: string): Promise<void> {
    const accRef = this.db.collection(this.accountsCollection).doc(accountId);
    const accDoc = await accRef.get();
    if (!accDoc.exists) return;

    const acc = accDoc.data() as Account;

    // 1. DATA FETCHING: Get all transactions involving this account
    const [asSourceSnap, asDestSnap] = await Promise.all([
      this.collection
        .where('accountId', '==', accountId)
        .where('deletedAt', '==', null)
        .where('status', 'in', ['completed', 'approved'])
        .get(),
      this.collection
        .where('toAccountId', '==', accountId)
        .where('deletedAt', '==', null)
        .where('status', 'in', ['completed', 'approved'])
        .get(),
    ]);

    // 2. MERGE & SORT: De-duplicate (transfers) and order chronologically
    const txMap = new Map<string, Transaction>();
    [...asSourceSnap.docs, ...asDestSnap.docs].forEach((doc) => {
      txMap.set(doc.id, { id: doc.id, ...doc.data() } as Transaction);
    });

    const txs = Array.from(txMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // 3. STATE INITIALIZATION
    // Use initialAmount from creation; legacy accounts without it use 0 or current balance.
    let balance: number;
    if (acc.initialAmount !== undefined && acc.initialAmount !== null) {
      balance = Number(acc.initialAmount);
    } else {
      balance = txs.length > 0 ? 0 : Number(acc.balance) || 0;
    }

    // Debt balances are inherently negative or zero
    if (acc.type === 'debt' && balance > 0) balance = -balance;

    let invested = balance; // Total capital contributed (for investments)
    let repaidCapital = 0; // Principal repaid (for debt)
    let burnedInterest = 0; // Total interest paid (for debt)

    const batch = this.db.batch();

    // 4. TRANSACTION REPLAY LOOP
    for (const tx of txs) {
      const amount = Number(tx.amount);

      if (tx.accountId === accountId) {
        /**
         * ACTION: Account is the SOURCE (Money leaving or spending)
         */
        if (tx.type === 'income') {
          // Special Case: Incomes usually go INTO accounts, but here it's sourced from this account.
          // This often handles balance syncs or adjustments.
          const isSync = tx.metadata?.isBalanceSync;

          if (acc.type === 'investment' && isSync) {
            balance = amount; // Absolute market valuation sync
          } else if (acc.type === 'card') {
            balance -= amount; // Spending on a card increases debt
          } else {
            balance += amount; // Standard income credit
          }
        } else {
          // Standard EXIT flow (Expense or Transfer Out)
          if (acc.type === 'card') {
            balance -= amount; // Card spending
          } else {
            balance -= amount;
            if (acc.type === 'investment') invested -= amount;
          }
        }

        batch.update(this.collection.doc(tx.id), { balanceAfter: balance });
      } else if (tx.toAccountId === accountId) {
        /**
         * ACTION: Account is the DESTINATION (Money arriving or being repaid)
         */
        if (acc.type === 'debt' || acc.type === 'card') {
          // Repayment logic: Split payment into principal vs interest
          const interest = Number(tx.interestAmount) || 0;
          const principal = amount - interest;

          balance += principal; // Reduces debt (moves balance toward 0)

          if (acc.type === 'debt') {
            repaidCapital += principal;
            burnedInterest += interest;
          }
        } else {
          // Standard arrival
          balance += amount;
          // Only explicit transfers into investments affect the "Invested Amount" (cost basis)
          if (acc.type === 'investment' && tx.type === 'transfer') {
            invested += amount;
          }
        }

        batch.update(this.collection.doc(tx.id), { toBalanceAfter: balance });
      }
    }

    // 5. FINAL ACCOUNT UPDATE
    const accUpdate: Partial<Account> = {
      balance,
      lastSyncedAt: new Date().toISOString(),
    };

    if (acc.type === 'investment') accUpdate.investedAmount = invested;
    if (acc.type === 'debt') {
      accUpdate.repaidCapital = repaidCapital;
      accUpdate.burnedInterest = burnedInterest;
    }

    // Apply manual valuation adjustments if present
    if (acc.valuationAdjustment) {
      balance += Number(acc.valuationAdjustment);
      accUpdate.balance = balance;
    }

    batch.update(accRef, accUpdate);
    await batch.commit();
  }

  // ---------------------------------------------------------------------------
  // Goal Progress
  // ---------------------------------------------------------------------------

  /** Recalculates a goal's currentAmount as the sum of all transfers into it. */
  public async recalculateGoalProgress(goalId: string): Promise<void> {
    const goalRef = this.db.collection(this.goalsCollection).doc(goalId);
    if (!(await goalRef.get()).exists) return;

    const goal = (await goalRef.get()).data() as FinancialGoal;
    const initial = Number(goal.initialAmount) || 0;

    const snapshot = await this.collection
      .where('toAccountId', '==', goalId)
      .where('deletedAt', '==', null)
      .where('status', '==', 'completed')
      .get();

    const total = snapshot.docs.reduce(
      (sum, doc) => sum + Number((doc.data() as Transaction).amount),
      initial,
    );

    await goalRef.update({ currentAmount: total });
  }

  // ---------------------------------------------------------------------------
  // Bulk Repair
  // ---------------------------------------------------------------------------

  /** Recalculates all accounts and goals for a user. Use as a "Repair Data" tool. */
  public async recalculateAllForUser(userId: string): Promise<void> {
    const [accountsSnap, goalsSnap] = await Promise.all([
      this.db
        .collection(this.accountsCollection)
        .where('userId', '==', userId)
        .where('deletedAt', '==', null)
        .get(),
      this.db
        .collection(this.goalsCollection)
        .where('userId', '==', userId)
        .where('deletedAt', '==', null)
        .get(),
    ]);

    for (const doc of accountsSnap.docs) {
      await this.recalculateBalances(doc.id);
    }
    for (const doc of goalsSnap.docs) {
      await this.recalculateGoalProgress(doc.id);
    }
  }
}
