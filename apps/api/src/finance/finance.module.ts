import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { ReconciliationService } from './reconciliation.service';
import { FinanceController } from './finance.controller';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';

@Module({
  controllers: [FinanceController],
  providers: [GoalService, ReconciliationService, FirebaseAdminService],
  exports: [GoalService, ReconciliationService, FirebaseAdminService],
})
export class FinanceModule {}
