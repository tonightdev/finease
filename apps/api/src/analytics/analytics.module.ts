import { Module } from '@nestjs/common';
import { AnalyticsService } from '@analytics/analytics.service';
import { AnalyticsController } from '@analytics/analytics.controller';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
