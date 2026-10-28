import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';

const DEFAULT_VAPID_PUBLIC_KEY =
  'BAdklf2iWNH9ED7MzgQrQpgiEBuaaOp_FIgTf00aBguOV5eundDJIl9LKPbbWQ84v2joEg4Lpb_qfm6y5F4819k';
const DEFAULT_VAPID_PRIVATE_KEY = '2ZvmbeadoYolaA-rCIrdWlCcL-rOw4VFtPUFdFIRN_o';
const DEFAULT_VAPID_SUBJECT = 'mailto:support@finease.app';

interface WebPushError extends Error {
  statusCode?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;
  private publicKey: string;

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {
    this.publicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
    const privateKey =
      process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;

    try {
      webpush.setVapidDetails(subject, this.publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('Web-Push VAPID details configured successfully');
    } catch (err) {
      this.logger.error('Failed to configure Web-Push VAPID details', err);
    }
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  async saveSubscription(
    userId: string,
    subscription: webpush.PushSubscription,
  ) {
    const db = this.firebaseAdmin.getFirestore();
    await db.collection('users').doc(userId).set(
      {
        pushSubscription: subscription,
        notificationsEnabled: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    this.logger.log(`Push subscription saved for user: ${userId}`);
    return { message: 'Push subscription synchronized' };
  }

  async removeSubscription(userId: string) {
    const db = this.firebaseAdmin.getFirestore();
    await db.collection('users').doc(userId).set(
      {
        pushSubscription: null,
        notificationsEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    this.logger.log(`Push subscription removed for user: ${userId}`);
    return { message: 'Push subscription revoked' };
  }

  async sendNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      url?: string;
      data?: Record<string, unknown>;
    },
  ) {
    if (!this.vapidConfigured) {
      this.logger.warn('Cannot send push notification: VAPID not configured');
      return { success: false, reason: 'VAPID not configured' };
    }

    const db = this.firebaseAdmin.getFirestore();
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      return { success: false, reason: 'User not found' };
    }

    const userData = doc.data();
    const subscription = userData?.pushSubscription as
      | webpush.PushSubscription
      | undefined;

    if (!subscription || !userData?.notificationsEnabled) {
      this.logger.log(`No active push subscription for user ${userId}`);
      return { success: false, reason: 'No active subscription' };
    }

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title || 'FinEase Notification',
          body: payload.body || 'You have an update from FinEase.',
          url: payload.url || '/dashboard',
          ...(payload.data ?? {}),
        }),
      );
      this.logger.log(`Push notification sent successfully to user ${userId}`);
      return { success: true };
    } catch (err: unknown) {
      const pushError = err as WebPushError;
      const errorMessage = pushError?.message || 'Unknown error';
      this.logger.error(
        `Error sending push notification to user ${userId}:`,
        errorMessage,
      );
      if (pushError?.statusCode === 404 || pushError?.statusCode === 410) {
        this.logger.warn(
          `Subscription expired for user ${userId}, revoking...`,
        );
        await this.removeSubscription(userId);
      }
      return { success: false, error: errorMessage };
    }
  }
}
