import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardStats } from '@repo/types';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:userId')
  async getDashboard(@Param('userId') userId: string): Promise<DashboardStats> {
    return this.analyticsService.getDashboardStats(userId);
  }
}
