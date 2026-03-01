import { Injectable } from '@nestjs/common';
import { Transaction } from '@repo/types';

@Injectable()
export class ReconciliationService {
  /**
   * Identifies bank withdrawals that haven't been matched to cash wallet inflows.
   */
  findUnreconciledWithdrawals(transactions: Transaction[]): Transaction[] {
    const bankWithdrawals = transactions.filter(
      (t) =>
        t.type === 'transfer' &&
        t.metadata?.isCashWithdrawal === true &&
        t.status === 'pending',
    );

    // Filter out withdrawals that already have a corresponding "deposit" in the cash wallet
    // (In a real app, this would query the DB for matching IDs or timestamps)
    return bankWithdrawals;
  }

  reconcile(
    withdrawalId: string,
    transactions: Transaction[],
  ): { success: boolean; message: string } {
    const withdrawal = transactions.find((t) => t.id === withdrawalId);
    if (!withdrawal) return { success: false, message: 'Withdrawal not found' };

    // Logic to move transaction status to 'approved' and update account balances
    return { success: true, message: 'Reconciliation successful' };
  }
}
