import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [AnalyticsModule, FinanceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
