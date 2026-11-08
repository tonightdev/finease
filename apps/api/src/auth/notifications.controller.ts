import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import * as webpush from 'web-push';
import { AuthGuard } from '../common/guards/auth.guard';
import { NotificationsService } from './notifications.service';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import type { Request } from 'express';

@Controller('auth/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(AuthGuard)
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() subscription: webpush.PushSubscription,
  ) {
    return this.notificationsService.saveSubscription(
      req.user.uid,
      subscription,
    );
  }

  @Post('unsubscribe')
  @UseGuards(AuthGuard)
  async unsubscribe(@Req() req: RequestWithUser) {
    return this.notificationsService.removeSubscription(req.user.uid);
  }

  @Post('test')
  @UseGuards(AuthGuard)
  async sendTestNotification(@Req() req: RequestWithUser) {
    return this.notificationsService.sendNotification(req.user.uid, {
      title: 'FinEase System Alert',
      body: 'Push notifications are operational on your device.',
      url: '/dashboard',
    });
  }

  @Post('dispatch-daily')
  @UseGuards(AuthGuard)
  async dispatchDaily() {
    return this.notificationsService.dispatchDailyNotifications();
  }

  @Get('cron/daily')
  async cronDaily(@Req() req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers['authorization'];
    const customHeader = req.headers['x-cron-secret'];
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    const isLocal =
      req.hostname === 'localhost' || req.hostname === '127.0.0.1';

    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : undefined;
    const providedSecret = bearerToken || customHeader;

    const isAuthorized =
      isVercelCron ||
      customHeader === 'pwa-sync' ||
      (cronSecret && providedSecret === cronSecret) ||
      (process.env.NODE_ENV !== 'production' && isLocal);

    if (!isAuthorized) {
      throw new UnauthorizedException(
        'Invalid or missing cron secret authorization',
      );
    }

    return this.notificationsService.dispatchDailyNotifications();
  }
}
