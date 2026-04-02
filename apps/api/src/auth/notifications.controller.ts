import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@Controller('auth/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  @Post('subscribe')
  async subscribe(@Req() req: RequestWithUser, @Body() subscription: any) {
    const db = this.firebaseAdmin.getFirestore();
    const userId = req.user.uid;

    // Store subscription in the user document or a sub-collection
    await db.collection('users').doc(userId).update({
      pushSubscription: subscription,
      notificationsEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    return { message: 'Push subscription synchronized' };
  }

  @Post('unsubscribe')
  async unsubscribe(@Req() req: RequestWithUser) {
    const db = this.firebaseAdmin.getFirestore();
    const userId = req.user.uid;

    await db.collection('users').doc(userId).update({
      pushSubscription: null,
      notificationsEnabled: false,
      updatedAt: new Date().toISOString(),
    });

    return { message: 'Push subscription revoked' };
  }
}
