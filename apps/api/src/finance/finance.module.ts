import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { ReconciliationService } from './reconciliation.service';
import { AccountsService } from './accounts.service';
import { TransactionsService } from './transactions.service';
import { CategoriesService } from './categories.service';
import { AssetClassesService } from './asset-classes.service';
import { FinanceController } from './finance.controller';
import { RemindersService } from './reminders.service';
import { SimulationService } from './simulation.service';
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
    RemindersService,
    SimulationService,
  ],
  exports: [
    GoalService,
    ReconciliationService,
    AccountsService,
    TransactionsService,
    CategoriesService,
    AssetClassesService,
    RemindersService,
    SimulationService,
  ],
})
export class FinanceModule {}
