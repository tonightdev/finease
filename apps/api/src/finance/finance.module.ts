import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { ReconciliationService } from './reconciliation.service';
import { AccountsService } from './accounts.service';
import { TransactionsService } from './transactions.service';
import { CategoriesService } from './categories.service';
import { AssetClassesService } from './asset-classes.service';
import { FinanceController } from './finance.controller';
import { ExpiriesService } from './expiries.service';
import { StrategyService } from './strategy.service';
import { SimulationsService } from './simulations.service';
import { YearlyExpensesService } from './yearly-expenses.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FinanceController],
  providers: [
    GoalService,
    ReconciliationService,
    AccountsService,
    TransactionsService,
    CategoriesService,
    AssetClassesService,
    ExpiriesService,
    StrategyService,
    SimulationsService,
    YearlyExpensesService,
  ],
  exports: [
    GoalService,
    ReconciliationService,
    AccountsService,
    TransactionsService,
    CategoriesService,
    AssetClassesService,
    ExpiriesService,
    StrategyService,
    SimulationsService,
    YearlyExpensesService,
  ],
})
export class FinanceModule {}
