import { Module } from '@nestjs/common';
import { GoalService } from '@finance/goal.service';
import { ReconciliationService } from '@finance/reconciliation.service';
import { AccountsService } from '@finance/accounts.service';
import { TransactionsService } from '@finance/transactions.service';
import { CategoriesService } from '@finance/categories.service';
import { AssetClassesService } from '@finance/asset-classes.service';
import { FinanceController } from '@finance/finance.controller';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';
import { UsersService } from '@common/services/users.service';
import { AuthModule } from '@auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FinanceController],
  providers: [
    GoalService,
    ReconciliationService,
    FirebaseAdminService,
    AccountsService,
    TransactionsService,
    CategoriesService,
    AssetClassesService,
    UsersService,
  ],
  exports: [
    GoalService,
    ReconciliationService,
    FirebaseAdminService,
    AccountsService,
    TransactionsService,
    CategoriesService,
    AssetClassesService,
    UsersService,
  ],
})
export class FinanceModule {}
