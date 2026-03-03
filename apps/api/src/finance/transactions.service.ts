import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';
import { Transaction, Account, FinancialGoal } from '@repo/types';

@Injectable()
export class TransactionsService {
  private readonly collectionName = 'transactions';
  private readonly accountsCollection = 'accounts';
  private readonly goalsCollection = 'goals';

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  private get db() {
    return this.firebaseAdmin.getFirestore();
  }

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  private calculateNextDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString();
  }

  async findAll(userId: string): Promise<Transaction[]> {
    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .get();
      const transactions = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Transaction,
      );
      // Sort in-memory to bypass index requirement
      return transactions.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error('CRITICAL: Error in findAll:', error);
      throw error;
    }
  }

  async create(transaction: Partial<Transaction>): Promise<Transaction> {
    const batch = this.db.batch();
    const txRef = this.collection.doc();
    if (!transaction.accountId) {
      throw new Error('Account ID is required for transaction');
    }
    const accRef = this.db
      .collection(this.accountsCollection)
      .doc(transaction.accountId);

    // 1. Calculate and set transaction properties
    // If a destination is provided, it's effectively a transfer
    const isTransfer = !!transaction.toAccountId;
    const effectiveType = isTransfer
      ? 'transfer'
      : transaction.type || 'expense';

    const status =
      transaction.status ||
      (transaction.isAutomated ? 'pending_confirmation' : 'completed');

    let balanceAfter: number | undefined;
    let toBalanceAfter: number | undefined;

    // 2. Adjust account balance ONLY IF NOT pending_confirmation
    if (status !== 'pending_confirmation') {
      const accDoc = await accRef.get();
      if (accDoc.exists) {
        const accData = accDoc.data() as Account;
        let balanceChange = Number(transaction.amount);

        if (effectiveType === 'expense' || effectiveType === 'transfer') {
          balanceChange = -balanceChange;
        }

        balanceAfter = (Number(accData.balance) || 0) + balanceChange;
        const accUpdate: Partial<Account> = {
          balance: balanceAfter,
          lastSyncedAt: new Date().toISOString(),
        };

        if (accData.type === 'investment') {
          accUpdate.investedAmount =
            (Number(accData.investedAmount) || Number(accData.balance) || 0) +
            balanceChange;
        }

        batch.update(accRef, accUpdate);
      }

      // 3. Handle transfers (To account or Goal)
      if (transaction.toAccountId) {
        // First check if it's an account
        const toAccRef = this.db
          .collection(this.accountsCollection)
          .doc(transaction.toAccountId);
        const toAccDoc = await toAccRef.get();

        if (toAccDoc.exists) {
          const toAccData = toAccDoc.data() as Account;
          if (toAccData.type === 'debt') {
            const interest = Number(transaction.interestAmount) || 0;
            const principal = Number(transaction.amount) - interest;

            toBalanceAfter = (Number(toAccData.balance) || 0) + principal;
            batch.update(toAccRef, {
              balance: toBalanceAfter,
              paidAmount: (Number(toAccData.paidAmount) || 0) + principal,
              interestPaid: (Number(toAccData.interestPaid) || 0) + interest,
              lastSyncedAt: new Date().toISOString(),
            });
          } else {
            toBalanceAfter =
              (Number(toAccData.balance) || 0) + Number(transaction.amount);

            const toAccUpdate: Partial<Account> = {
              balance: toBalanceAfter,
              lastSyncedAt: new Date().toISOString(),
            };

            if (toAccData.type === 'investment') {
              toAccUpdate.investedAmount =
                (Number(toAccData.investedAmount) ||
                  Number(toAccData.balance) ||
                  0) + Number(transaction.amount);
            }

            batch.update(toAccRef, toAccUpdate);
          }
        } else {
          // If not found in accounts, check if it's a goal
          const goalRef = this.db
            .collection(this.goalsCollection)
            .doc(transaction.toAccountId);
          const goalDoc = await goalRef.get();

          if (goalDoc.exists) {
            const goalData = goalDoc.data() as FinancialGoal;
            toBalanceAfter =
              (Number(goalData.currentAmount) || 0) +
              Number(transaction.amount);
            batch.update(goalRef, {
              currentAmount: toBalanceAfter,
            });
          }
        }
      }
    }

    // 4. Create transaction document with calculated balances
    batch.set(txRef, {
      ...transaction,
      id: txRef.id,
      status,
      type: effectiveType,
      date: transaction.date || new Date().toISOString(),
      balanceAfter,
      toBalanceAfter,
    });

    await batch.commit();
    const createdTx = await txRef.get();
    return createdTx.data() as Transaction;
  }

  async findOne(id: string): Promise<Transaction> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as Transaction;
  }

  async update(
    id: string,
    updateData: Partial<Transaction>,
  ): Promise<Transaction> {
    const oldTx = await this.findOne(id);

    // Simplest way to "update" balance is:
    // 1. Revert old transaction balances
    // 2. Clear old status logic
    // 3. Apply new transaction balances

    const batch = this.db.batch();

    // Revert Old
    if (oldTx.status !== 'pending_confirmation') {
      const oldAccRef = this.db
        .collection(this.accountsCollection)
        .doc(oldTx.accountId);
      const oldAccDoc = await oldAccRef.get();
      if (oldAccDoc.exists) {
        const oldAccData = oldAccDoc.data() as Account;
        let rev = Number(oldTx.amount);
        if (oldTx.type !== 'income') {
          // Revert based on original type
          rev = -rev; // If it was expense/transfer, add it back. If income, subtract.
        }
        const oldAccBalance = (Number(oldAccData.balance) || 0) - rev;
        const oldAccUpdate: Partial<Account> = {
          balance: oldAccBalance,
          lastSyncedAt: new Date().toISOString(),
        };

        if (oldAccData.type === 'investment') {
          oldAccUpdate.investedAmount =
            (Number(oldAccData.investedAmount) ||
              Number(oldAccData.balance) ||
              0) - rev;
        }

        batch.update(oldAccRef, oldAccUpdate);
      }

      if (oldTx.toAccountId) {
        // Try account first
        const toAccRef = this.db
          .collection(this.accountsCollection)
          .doc(oldTx.toAccountId);
        const toAccDoc = await toAccRef.get();
        if (toAccDoc.exists) {
          const toAccData = toAccDoc.data() as Account;
          const revertAmount = Number(oldTx.amount);

          if (toAccData.type === 'debt') {
            const interest = Number(oldTx.interestAmount) || 0;
            const principal = revertAmount - interest;
            batch.update(toAccRef, {
              balance: (Number(toAccData.balance) || 0) - principal,
              paidAmount: (Number(toAccData.paidAmount) || 0) - principal,
              interestPaid: (Number(toAccData.interestPaid) || 0) - interest,
            });
          } else {
            const newToBalance =
              (Number(toAccData.balance) || 0) - revertAmount;
            const toAccUpdate: Partial<Account> = {
              balance: newToBalance,
            };

            if (toAccData.type === 'investment') {
              toAccUpdate.investedAmount =
                (Number(toAccData.investedAmount) ||
                  Number(toAccData.balance) ||
                  0) - revertAmount;
            }

            batch.update(toAccRef, toAccUpdate);
          }
        } else {
          // Check goal
          const goalRef = this.db
            .collection(this.goalsCollection)
            .doc(oldTx.toAccountId);
          const goalDoc = await goalRef.get();
          if (goalDoc.exists) {
            const goalData = goalDoc.data() as FinancialGoal;
            batch.update(goalRef, {
              currentAmount:
                (Number(goalData.currentAmount) || 0) - Number(oldTx.amount),
            });
          }
        }
      }
    }

    // Apply New
    const newTx = { ...oldTx, ...updateData };
    const isTransfer = !!newTx.toAccountId;
    const effectiveType = isTransfer ? 'transfer' : newTx.type || 'expense';

    const status =
      newTx.status ||
      (newTx.isAutomated ? 'pending_confirmation' : 'completed');

    let balanceAfter: number | undefined;
    let toBalanceAfter: number | undefined;

    if (status !== 'pending_confirmation') {
      const newAccRef = this.db
        .collection(this.accountsCollection)
        .doc(newTx.accountId);
      const newAccDoc = await newAccRef.get();
      if (newAccDoc.exists) {
        const newAccData = newAccDoc.data() as Account;
        let change = Number(newTx.amount);
        if (effectiveType === 'expense' || effectiveType === 'transfer') {
          change = -change;
        }
        balanceAfter = (Number(newAccData.balance) || 0) + change;
        const newAccUpdate: Partial<Account> = {
          balance: balanceAfter,
          lastSyncedAt: new Date().toISOString(),
        };

        if (newAccData.type === 'investment') {
          newAccUpdate.investedAmount =
            (Number(newAccData.investedAmount) ||
              Number(newAccData.balance) ||
              0) + change;
        }

        batch.update(newAccRef, newAccUpdate);
      }

      if (newTx.toAccountId) {
        // Try account first
        const toAccRef = this.db
          .collection(this.accountsCollection)
          .doc(newTx.toAccountId);
        const toAccDoc = await toAccRef.get();
        if (toAccDoc.exists) {
          const toAccData = toAccDoc.data() as Account;
          const applyAmount = Number(newTx.amount);

          if (toAccData.type === 'debt') {
            const interest = Number(newTx.interestAmount) || 0;
            const principal = applyAmount - interest;
            toBalanceAfter = (Number(toAccData.balance) || 0) + principal;
            batch.update(toAccRef, {
              balance: toBalanceAfter,
              paidAmount: (Number(toAccData.paidAmount) || 0) + principal,
              interestPaid: (Number(toAccData.interestPaid) || 0) + interest,
            });
          } else {
            toBalanceAfter = (Number(toAccData.balance) || 0) + applyAmount;
            const toAccUpdate: Partial<Account> = {
              balance: toBalanceAfter,
            };

            if (toAccData.type === 'investment') {
              toAccUpdate.investedAmount =
                (Number(toAccData.investedAmount) ||
                  Number(toAccData.balance) ||
                  0) + applyAmount;
            }

            batch.update(toAccRef, toAccUpdate);
          }
        } else {
          // Check goal
          const goalRef = this.db
            .collection(this.goalsCollection)
            .doc(newTx.toAccountId);
          const goalDoc = await goalRef.get();
          if (goalDoc.exists) {
            const goalData = goalDoc.data() as FinancialGoal;
            toBalanceAfter =
              (Number(goalData.currentAmount) || 0) + Number(newTx.amount);
            batch.update(goalRef, {
              currentAmount: toBalanceAfter,
            });
          }
        }
      }
    }

    batch.update(this.collection.doc(id), {
      ...updateData,
      status,
      type: effectiveType,
      balanceAfter,
      toBalanceAfter,
    });
    await batch.commit();
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const batch = this.db.batch();
    const txRef = this.collection.doc(id);
    const txDoc = await txRef.get();

    if (!txDoc.exists) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const txData = txDoc.data() as Transaction;

    // 1. Revert main account balance
    const accRef = this.db
      .collection(this.accountsCollection)
      .doc(txData.accountId);
    const accDoc = await accRef.get();

    if (accDoc.exists) {
      const accData = accDoc.data() as Account;
      let balanceReversion = Number(txData.amount);

      // If original was expense (subtracted), we ADD it back.
      // If original was income (added), we SUBTRACT it.
      if (txData.type !== 'income') {
        // Revert based on original type
        balanceReversion = -balanceReversion; // If it was expense/transfer, add it back. If income, subtract.
      }

      const newBalance = (Number(accData.balance) || 0) - balanceReversion;
      const accUpdatePage: Partial<Account> = {
        balance: newBalance,
        lastSyncedAt: new Date().toISOString(),
      };

      if (accData.type === 'investment') {
        accUpdatePage.investedAmount =
          (Number(accData.investedAmount) || Number(accData.balance) || 0) -
          balanceReversion;
      }

      batch.update(accRef, accUpdatePage);
    }

    // 2. Revert transfer toAccount balance
    if (txData.toAccountId) {
      // First check if it's an account
      const toAccRef = this.db
        .collection(this.accountsCollection)
        .doc(txData.toAccountId);
      const toAccDoc = await toAccRef.get();

      if (toAccDoc.exists) {
        const toAccData = toAccDoc.data() as Account;
        const revertAmount = Number(txData.amount);

        if (toAccData.type === 'debt') {
          const interest = Number(txData.interestAmount) || 0;
          const principal = revertAmount - interest;

          batch.update(toAccRef, {
            balance: (Number(toAccData.balance) || 0) - principal,
            paidAmount: (Number(toAccData.paidAmount) || 0) - principal,
            interestPaid: (Number(toAccData.interestPaid) || 0) - interest,
            lastSyncedAt: new Date().toISOString(),
          });
        } else {
          // Transfer was ADDED to toAccount, so we SUBTRACT.
          const newToBalance = (Number(toAccData.balance) || 0) - revertAmount;
          const toAccUpdate: Partial<Account> = {
            balance: newToBalance,
            lastSyncedAt: new Date().toISOString(),
          };

          if (toAccData.type === 'investment') {
            toAccUpdate.investedAmount =
              (Number(toAccData.investedAmount) ||
                Number(toAccData.balance) ||
                0) - revertAmount;
          }

          batch.update(toAccRef, toAccUpdate);
        }
      } else {
        // If not found in accounts, check if it's a goal
        const goalRef = this.db
          .collection(this.goalsCollection)
          .doc(txData.toAccountId);
        const goalDoc = await goalRef.get();
        if (goalDoc.exists) {
          const goalData = goalDoc.data() as FinancialGoal;
          batch.update(goalRef, {
            currentAmount:
              (Number(goalData.currentAmount) || 0) - Number(txData.amount),
          });
        }
      }
    }

    // 3. Delete transaction
    batch.delete(txRef);
    await batch.commit();
  }

  async removeByAccountId(accountId: string): Promise<void> {
    const snapshot = await this.collection
      .where('accountId', '==', accountId)
      .get();
    const batch = this.db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async confirm(id: string): Promise<Transaction> {
    const batch = this.db.batch();
    const txRef = this.collection.doc(id);
    const txDoc = await txRef.get();

    if (!txDoc.exists) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const txData = txDoc.data() as Transaction;
    if (txData.status !== 'pending_confirmation') {
      return txData;
    }

    // 1. Update status to completed
    let balanceAfter: number | undefined;
    let toBalanceAfter: number | undefined;

    // 2. Adjust primary account balance
    const accRef = this.db
      .collection(this.accountsCollection)
      .doc(txData.accountId);
    const accDoc = await accRef.get();
    if (accDoc.exists) {
      const accData = accDoc.data() as Account;
      let balanceChange = Number(txData.amount);
      if (txData.type === 'expense' || txData.type === 'transfer') {
        balanceChange = -balanceChange;
      }

      balanceAfter = (Number(accData.balance) || 0) + balanceChange;
      const confirmAccUpdate: Partial<Account> = {
        balance: balanceAfter,
        lastSyncedAt: new Date().toISOString(),
      };

      if (accData.type === 'investment') {
        confirmAccUpdate.investedAmount =
          (Number(accData.investedAmount) || Number(accData.balance) || 0) +
          balanceChange;
      }

      batch.update(accRef, confirmAccUpdate);
    }

    // 3. Handle transfers (Account or Goal)
    if (txData.toAccountId) {
      const toAccRef = this.db
        .collection(this.accountsCollection)
        .doc(txData.toAccountId);
      const toAccDoc = await toAccRef.get();

      if (toAccDoc.exists) {
        const toAccData = toAccDoc.data() as Account;
        const applyAmount = Number(txData.amount);

        if (toAccData.type === 'debt') {
          const interest = Number(txData.interestAmount) || 0;
          const principal = applyAmount - interest;

          toBalanceAfter = (Number(toAccData.balance) || 0) + principal;
          batch.update(toAccRef, {
            balance: toBalanceAfter,
            paidAmount: (Number(toAccData.paidAmount) || 0) + principal,
            interestPaid: (Number(toAccData.interestPaid) || 0) + interest,
            lastSyncedAt: new Date().toISOString(),
          });
        } else {
          toBalanceAfter = (Number(toAccData.balance) || 0) + applyAmount;
          const confirmToAccUpdate: Partial<Account> = {
            balance: toBalanceAfter,
            lastSyncedAt: new Date().toISOString(),
          };

          if (toAccData.type === 'investment') {
            confirmToAccUpdate.investedAmount =
              (Number(toAccData.investedAmount) ||
                Number(toAccData.balance) ||
                0) + applyAmount;
          }

          batch.update(toAccRef, confirmToAccUpdate);
        }
      } else {
        // Goal?
        const goalRef = this.db
          .collection(this.goalsCollection)
          .doc(txData.toAccountId);
        const goalDoc = await goalRef.get();
        if (goalDoc.exists) {
          const goalData = goalDoc.data() as FinancialGoal;
          toBalanceAfter =
            (Number(goalData.currentAmount) || 0) + Number(txData.amount);
          batch.update(goalRef, {
            currentAmount: toBalanceAfter,
          });
        }
      }
    }

    // 4. Update status and store balances
    batch.update(txRef, {
      status: 'completed',
      balanceAfter,
      toBalanceAfter,
    });

    // 4. Generate next occurrence if automated
    if (txData.isAutomated && txData.frequency) {
      const currentCount = Number(txData.recurringCount);
      if (!isNaN(currentCount) && currentCount > 1) {
        const nextDate = this.calculateNextDate(txData.date, txData.frequency);

        // Check if a transaction for this next occurrence already exists
        const existingNextTx = await this.collection
          .where('userId', '==', txData.userId)
          .where('accountId', '==', txData.accountId)
          .where('description', '==', txData.description)
          .where('date', '==', nextDate)
          .limit(1)
          .get();

        if (existingNextTx.empty) {
          const nextTxRef = this.collection.doc();
          batch.set(nextTxRef, {
            ...txData,
            id: nextTxRef.id,
            date: nextDate,
            status: 'pending_confirmation',
            recurringCount: currentCount - 1,
          });
        }
      }
    }

    await batch.commit();
    return { ...txData, status: 'completed' } as Transaction;
  }
}
