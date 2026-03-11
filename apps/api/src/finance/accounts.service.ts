import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { Account } from '@repo/types';
import { TransactionsService } from './transactions.service';

@Injectable()
export class AccountsService {
  private readonly collectionName = 'accounts';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly transactionsService: TransactionsService,
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
    return { id: doc.id, ...doc.data() } as Account;
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
        await this.transactionsService.create({
          userId: currentAccount.userId,
          accountId: id,
          amount: Math.abs(delta),
          type: delta > 0 ? 'income' : 'expense',
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

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Cascade soft-delete transactions related to this account
    await this.transactionsService.removeByAccountId(id);
    // Soft-delete the account itself
    await this.collection.doc(id).update({
      deletedAt: new Date().toISOString(),
    });
  }
}
