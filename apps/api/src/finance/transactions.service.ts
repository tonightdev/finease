import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';
import { Transaction, Account } from '@repo/types';

@Injectable()
export class TransactionsService {
  private readonly collectionName = 'transactions';
  private readonly accountsCollection = 'accounts';

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

    // 1. Create transaction document
    // 1. Create transaction document
    const status =
      transaction.status ||
      (transaction.isAutomated ? 'pending_confirmation' : 'completed');

    batch.set(txRef, {
      ...transaction,
      id: txRef.id,
      status,
      date: transaction.date || new Date().toISOString(),
    });

    // 2. Adjust account balance ONLY IF NOT pending_confirmation
    if (status !== 'pending_confirmation') {
      const accDoc = await accRef.get();
      if (accDoc.exists) {
        const accData = accDoc.data() as Account;
        let balanceChange = Number(transaction.amount);

        if (transaction.type === 'expense') {
          balanceChange = -balanceChange;
        }

        const newBalance = (Number(accData.balance) || 0) + balanceChange;
        batch.update(accRef, {
          balance: newBalance,
          lastSyncedAt: new Date().toISOString(),
        });
      }

      // 3. Handle transfers (To account)
      if (transaction.type === 'transfer' && transaction.toAccountId) {
        const toAccRef = this.db
          .collection(this.accountsCollection)
          .doc(transaction.toAccountId);
        const toAccDoc = await toAccRef.get();
        if (toAccDoc.exists) {
          const toAccData = toAccDoc.data() as Account;
          if (toAccData.type === 'debt') {
            const interest = Number(transaction.interestAmount) || 0;
            const principal = Number(transaction.amount) - interest;

            batch.update(toAccRef, {
              balance: (Number(toAccData.balance) || 0) + principal,
              paidAmount: (Number(toAccData.paidAmount) || 0) + principal,
              interestPaid: (Number(toAccData.interestPaid) || 0) + interest,
              lastSyncedAt: new Date().toISOString(),
            });
          } else {
            const newToBalance =
              (Number(toAccData.balance) || 0) + Number(transaction.amount);
            batch.update(toAccRef, {
              balance: newToBalance,
              lastSyncedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

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
        if (oldTx.type !== 'expense') rev = -rev;
        batch.update(oldAccRef, {
          balance: (Number(oldAccData.balance) || 0) + rev,
          lastSyncedAt: new Date().toISOString(),
        });
      }

      if (oldTx.type === 'transfer' && oldTx.toAccountId) {
        const toAccRef = this.db
          .collection(this.accountsCollection)
          .doc(oldTx.toAccountId);
        const toAccDoc = await toAccRef.get();
        if (toAccDoc.exists) {
          const toAccData = toAccDoc.data() as Account;
          if (toAccData.type === 'debt') {
            const interest = Number(oldTx.interestAmount) || 0;
            const principal = Number(oldTx.amount) - interest;
            batch.update(toAccRef, {
              balance: (Number(toAccData.balance) || 0) - principal,
              paidAmount: (Number(toAccData.paidAmount) || 0) - principal,
              interestPaid: (Number(toAccData.interestPaid) || 0) - interest,
            });
          } else {
            batch.update(toAccRef, {
              balance: (Number(toAccData.balance) || 0) - Number(oldTx.amount),
            });
          }
        }
      }
    }

    // Apply New
    const newTx = { ...oldTx, ...updateData };
    const status =
      newTx.status ||
      (newTx.isAutomated ? 'pending_confirmation' : 'completed');

    if (status !== 'pending_confirmation') {
      const newAccRef = this.db
        .collection(this.accountsCollection)
        .doc(newTx.accountId);
      const newAccDoc = await newAccRef.get();
      if (newAccDoc.exists) {
        const newAccData = newAccDoc.data() as Account;
        let change = Number(newTx.amount);
        if (newTx.type === 'expense') change = -change;
        batch.update(newAccRef, {
          balance: (Number(newAccData.balance) || 0) + change,
          lastSyncedAt: new Date().toISOString(),
        });
      }

      if (newTx.type === 'transfer' && newTx.toAccountId) {
        const toAccRef = this.db
          .collection(this.accountsCollection)
          .doc(newTx.toAccountId);
        const toAccDoc = await toAccRef.get();
        if (toAccDoc.exists) {
          const toAccData = toAccDoc.data() as Account;
          if (toAccData.type === 'debt') {
            const interest = Number(newTx.interestAmount) || 0;
            const principal = Number(newTx.amount) - interest;
            batch.update(toAccRef, {
              balance: (Number(toAccData.balance) || 0) + principal,
              paidAmount: (Number(toAccData.paidAmount) || 0) + principal,
              interestPaid: (Number(toAccData.interestPaid) || 0) + interest,
            });
          } else {
            batch.update(toAccRef, {
              balance: (Number(toAccData.balance) || 0) + Number(newTx.amount),
            });
          }
        }
      }
    }

    batch.update(this.collection.doc(id), { ...updateData, status });
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
      if (txData.type !== 'expense') {
        balanceReversion = -balanceReversion;
      }

      batch.update(accRef, {
        balance: (Number(accData.balance) || 0) + balanceReversion,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    // 2. Revert transfer toAccount balance
    if (txData.type === 'transfer' && txData.toAccountId) {
      const toAccRef = this.db
        .collection(this.accountsCollection)
        .doc(txData.toAccountId);
      const toAccDoc = await toAccRef.get();

      if (toAccDoc.exists) {
        const toAccData = toAccDoc.data() as Account;
        if (toAccData.type === 'debt') {
          const interest = Number(txData.interestAmount) || 0;
          const principal = Number(txData.amount) - interest;

          batch.update(toAccRef, {
            balance: (Number(toAccData.balance) || 0) - principal,
            paidAmount: (Number(toAccData.paidAmount) || 0) - principal,
            interestPaid: (Number(toAccData.interestPaid) || 0) - interest,
            lastSyncedAt: new Date().toISOString(),
          });
        } else {
          // Transfer was ADDED to toAccount, so we SUBTRACT.
          batch.update(toAccRef, {
            balance: (Number(toAccData.balance) || 0) - Number(txData.amount),
            lastSyncedAt: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Delete transaction
    batch.delete(txRef);
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
    batch.update(txRef, { status: 'completed' });

    // 2. Adjust primary account balance
    const accRef = this.db
      .collection(this.accountsCollection)
      .doc(txData.accountId);
    const accDoc = await accRef.get();
    if (accDoc.exists) {
      const accData = accDoc.data() as Account;
      let balanceChange = Number(txData.amount);
      if (txData.type === 'expense') balanceChange = -balanceChange;

      batch.update(accRef, {
        balance: (Number(accData.balance) || 0) + balanceChange,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    // 3. Handle transfers
    if (txData.type === 'transfer' && txData.toAccountId) {
      const toAccRef = this.db
        .collection(this.accountsCollection)
        .doc(txData.toAccountId);
      const toAccDoc = await toAccRef.get();
      if (toAccDoc.exists) {
        const toAccData = toAccDoc.data() as Account;
        if (toAccData.type === 'debt') {
          const interest = Number(txData.interestAmount) || 0;
          const principal = Number(txData.amount) - interest;

          batch.update(toAccRef, {
            balance: (Number(toAccData.balance) || 0) + principal,
            paidAmount: (Number(toAccData.paidAmount) || 0) + principal,
            interestPaid: (Number(toAccData.interestPaid) || 0) + interest,
            lastSyncedAt: new Date().toISOString(),
          });
        } else {
          batch.update(toAccRef, {
            balance: (Number(toAccData.balance) || 0) + Number(txData.amount),
            lastSyncedAt: new Date().toISOString(),
          });
        }
      }
    }

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
    return { ...txData, status: 'completed' };
  }
}
