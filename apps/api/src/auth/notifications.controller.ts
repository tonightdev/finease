import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import * as webpush from 'web-push';
import { AuthGuard } from '../common/guards/auth.guard';
import { NotificationsService } from './notifications.service';
import type { RequestWithUser } from '../common/interfaces/request.interface';

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
}
