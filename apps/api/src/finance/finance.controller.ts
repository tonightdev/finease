import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { GoalService } from './goal.service';
import { ReconciliationService } from './reconciliation.service';
import type { FinancialGoal, Transaction } from '@repo/types';

@Controller('finance')
@UseGuards(AuthGuard)
export class FinanceController {
  constructor(
    private readonly goalService: GoalService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  @Post('goal/requirement')
  getMonthlyRequirement(@Body() goal: FinancialGoal) {
    return {
      monthlyRequirement: this.goalService.calculateMonthlyRequirement(goal),
      health: this.goalService.getGoalHealth(goal),
    };
  }

  @Post('reconcile/:id')
  reconcileTransaction(
    @Param('id') id: string,
    @Body('transactions') transactions: Transaction[],
  ) {
    return this.reconciliationService.reconcile(id, transactions);
  }

  @Post('reconcile/pending')
  getPendingReconciliations(@Body('transactions') transactions: Transaction[]) {
    return this.reconciliationService.findUnreconciledWithdrawals(transactions);
  }
}
