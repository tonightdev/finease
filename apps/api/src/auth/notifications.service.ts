import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as webpush from 'web-push';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
interface WebPushError extends Error {
  statusCode?: number;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;
  private publicKey: string | null = null;
  private timerId: NodeJS.Timeout | null = null;

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@finease.app';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'Web-Push VAPID keys are not configured in environment variables. Push notifications are disabled.',
      );
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.publicKey = publicKey;
      this.vapidConfigured = true;
      this.logger.log('Web-Push VAPID details configured successfully');
    } catch (err) {
      this.logger.error('Failed to configure Web-Push VAPID details', err);
    }
  }

  getPublicKey(): string | null {
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

  onModuleInit() {
    this.scheduleDailyTimer();
  }

  onModuleDestroy() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleDailyTimer() {
    const calculateDelayUntil11AM = () => {
      const now = new Date();
      // Target 11:00 AM local server time
      const nextRun = new Date(now);
      nextRun.setHours(11, 0, 0, 0);
      if (now.getTime() >= nextRun.getTime()) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      return nextRun.getTime() - now.getTime();
    };

    const scheduleNext = () => {
      const delay = calculateDelayUntil11AM();
      const minutes = (delay / (1000 * 60)).toFixed(1);
      this.logger.log(
        `Next daily 11:00 AM notification scheduled in ${minutes} minutes.`,
      );
      this.timerId = setTimeout(() => {
        void this.dispatchDailyNotifications();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  async dispatchDailyNotifications(): Promise<{
    processed: number;
    sent: number;
  }> {
    if (!this.vapidConfigured) {
      this.logger.warn(
        'Daily notification dispatch skipped: VAPID not configured',
      );
      return { processed: 0, sent: 0 };
    }

    const db = this.firebaseAdmin.getFirestore();
    const usersSnapshot = await db
      .collection('users')
      .where('notificationsEnabled', '==', true)
      .get();

    let processed = 0;
    let sent = 0;
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    for (const userDoc of usersSnapshot.docs) {
      processed++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      if (!userData?.pushSubscription) continue;

      let notificationSent = false;

      // 1. Expiries Horizon Check (3 days)
      try {
        const expiriesSnap = await db
          .collection('expiries')
          .where('userId', '==', userId)
          .get();

        const expiringItems = expiriesSnap.docs
          .map((d) => d.data())
          .filter((exp: Record<string, unknown>) => {
            if (exp.deletedAt) return false;
            const expDate = new Date(exp.expiryDate as string);
            return expDate > now && expDate <= threeDaysFromNow;
          });

        if (expiringItems.length > 0) {
          const count = expiringItems.length;
          const firstName =
            (expiringItems[0]?.name as string | undefined) ?? 'Item';
          const body =
            count === 1
              ? `${firstName} is expiring soon. Check your vault.`
              : `${firstName} and ${count - 1} other item${count > 2 ? 's are' : ' is'} expiring soon.`;

          const result = await this.sendNotification(userId, {
            title: 'FinEase Expiry Reminder',
            body,
            url: '/plans?tab=Expiries',
          });

          if (result.success) {
            sent++;
            notificationSent = true;
          }
        }
      } catch (err) {
        this.logger.warn(`Error checking expiries for user ${userId}:`, err);
      }

      if (notificationSent) continue;

      // 2. Fiscal Cycle Reset or Ending Check
      try {
        const monthStartDate = (userData.monthStartDate as number) || 1;
        const currentFiscalStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          monthStartDate,
        );
        if (now < currentFiscalStart) {
          currentFiscalStart.setMonth(currentFiscalStart.getMonth() - 1);
        }

        const daysSinceReset = Math.floor(
          (now.getTime() - currentFiscalStart.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const nextFiscalStart = new Date(currentFiscalStart);
        nextFiscalStart.setMonth(nextFiscalStart.getMonth() + 1);
        const daysUntilReset = Math.ceil(
          (nextFiscalStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysSinceReset === 1 || daysSinceReset === 2) {
          const res = await this.sendNotification(userId, {
            title: 'Fiscal Cycle Reset 📊',
            body: 'Your new financial cycle started recently. Time to track your latest expenses, review your balances, and keep your budget in check!',
            url: '/transactions',
          });
          if (res.success) {
            sent++;
            notificationSent = true;
          }
        } else if (daysUntilReset === 2 || daysUntilReset === 3) {
          const res = await this.sendNotification(userId, {
            title: 'Fiscal Cycle Ending Soon ⏳',
            body: `Your financial cycle wraps up in ${daysUntilReset} days. Time to review your expenses, settle pending entries, and keep your budget on target!`,
            url: '/reports',
          });
          if (res.success) {
            sent++;
            notificationSent = true;
          }
        }
      } catch (cycleErr) {
        this.logger.warn(
          `Error checking fiscal cycle for user ${userId}:`,
          cycleErr,
        );
      }

      if (notificationSent) continue;

      // 3. Weekly Digest on Sunday (day 0)
      if (now.getDay() === 0) {
        try {
          const sevenDaysAgo = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000,
          );
          const txSnap = await db
            .collection('transactions')
            .where('userId', '==', userId)
            .get();

          const weekTxs = txSnap.docs
            .map((d) => d.data())
            .filter((tx: Record<string, unknown>) => {
              if (tx.deletedAt) return false;
              return new Date(tx.date as string) >= sevenDaysAgo;
            });

          const weekExpense = weekTxs
            .filter((t: Record<string, unknown>) => t.type === 'expense')
            .reduce(
              (s: number, t: Record<string, unknown>) =>
                s + (Number(t.amount) || 0),
              0,
            );
          const weekIncome = weekTxs
            .filter((t: Record<string, unknown>) => t.type === 'income')
            .reduce(
              (s: number, t: Record<string, unknown>) =>
                s + (Number(t.amount) || 0),
              0,
            );

          if (weekExpense > 0 || weekIncome > 0) {
            const saved = weekIncome - weekExpense;
            const res = await this.sendNotification(userId, {
              title: 'FinEase Weekly Digest',
              body: `This week: ${weekIncome > 0 ? `Rs.${Math.round(weekIncome).toLocaleString('en-IN')} in, ` : ''}Rs.${Math.round(weekExpense).toLocaleString('en-IN')} spent. ${saved >= 0 ? `Saved Rs.${Math.round(saved).toLocaleString('en-IN')}.` : `Overspent by Rs.${Math.round(-saved).toLocaleString('en-IN')}.`}`,
              url: '/reports',
            });
            if (res.success) {
              sent++;
              notificationSent = true;
            }
          }
        } catch (txErr) {
          this.logger.warn(
            `Error checking weekly transactions for user ${userId}:`,
            txErr,
          );
        }
      }

      if (notificationSent) continue;

      // 4. Net Worth Milestone Celebration (25L, 50L, 1Cr, 2Cr, 5Cr, 10Cr)
      try {
        const accountsSnap = await db
          .collection('accounts')
          .where('userId', '==', userId)
          .get();

        const activeAccounts = accountsSnap.docs
          .map((d) => d.data() as Record<string, unknown>)
          .filter((a) => !a.deletedAt && !a.isClosed);

        const assets = activeAccounts
          .filter((a) => a.type !== 'debt')
          .reduce((s: number, a) => s + Math.max(0, Number(a.balance) || 0), 0);
        const debts = activeAccounts
          .filter((a) => a.type === 'debt' || a.type === 'card')
          .reduce(
            (s: number, a) => s + Math.max(0, Math.abs(Number(a.balance) || 0)),
            0,
          );
        const netWorth = assets - debts;

        if (netWorth > 0) {
          const milestones = [
            { amount: 100_000_000, label: 'Rs.10Cr' },
            { amount: 50_000_000, label: 'Rs.5Cr' },
            { amount: 20_000_000, label: 'Rs.2Cr' },
            { amount: 10_000_000, label: 'Rs.1Cr' },
            { amount: 5_000_000, label: 'Rs.50L' },
            { amount: 2_500_000, label: 'Rs.25L' },
          ];

          const highestMilestone = milestones.find((m) => netWorth >= m.amount);
          const lastNotifiedMilestone = Number(
            userData.lastNotifiedMilestone || 0,
          );

          if (
            highestMilestone &&
            highestMilestone.amount > lastNotifiedMilestone
          ) {
            const res = await this.sendNotification(userId, {
              title: 'Milestone Unlocked! 🎉',
              body: `Your net worth just crossed ${highestMilestone.label}! Keep the momentum going.`,
              url: '/dashboard',
            });
            if (res.success) {
              sent++;
              notificationSent = true;
              await db
                .collection('users')
                .doc(userId)
                .set(
                  { lastNotifiedMilestone: highestMilestone.amount },
                  { merge: true },
                );
            }
          }
        }

        if (notificationSent) continue;

        // 5. Low Emergency Fund / Runway Alert (< 3 months buffer)
        const liquidBalance = activeAccounts
          .filter((a) => a.type === 'bank' || a.type === 'cash')
          .reduce((s: number, a) => s + Math.max(0, Number(a.balance) || 0), 0);

        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        const txSnap = await db
          .collection('transactions')
          .where('userId', '==', userId)
          .get();

        const monthlyExpenses = txSnap.docs
          .map((d) => d.data() as Record<string, unknown>)
          .filter((t) => {
            if (t.deletedAt) return false;
            return (
              t.type === 'expense' &&
              new Date(t.date as string) >= thirtyDaysAgo
            );
          })
          .reduce((s: number, t) => s + (Number(t.amount) || 0), 0);

        if (monthlyExpenses > 0 && liquidBalance > 0) {
          const runway = liquidBalance / monthlyExpenses;
          if (runway < 3) {
            const res = await this.sendNotification(userId, {
              title: 'Emergency Fund Alert',
              body: `Liquid reserves cover only ${runway.toFixed(1)} months of expenses. Safe minimum is 3 months. Consider building your buffer.`,
              url: '/reports',
            });
            if (res.success) {
              sent++;
              notificationSent = true;
            }
          }
        }
      } catch (finErr) {
        this.logger.warn(
          `Error checking financial stats for user ${userId}:`,
          finErr,
        );
      }

      if (notificationSent) continue;

      // 6. Goal Pacing Alert
      try {
        const goalsSnap = await db
          .collection('goals')
          .where('userId', '==', userId)
          .get();

        const activeGoals = goalsSnap.docs
          .map((d) => d.data() as Record<string, unknown>)
          .filter((g) => !g.deletedAt && g.startDate && g.targetDate);

        const behindGoal = activeGoals.find((g) => {
          const start = new Date(g.startDate as string);
          const target = new Date(g.targetDate as string);
          if (now >= target) return false;
          const elapsed = Math.max(0, now.getTime() - start.getTime());
          const total = Math.max(1, target.getTime() - start.getTime());
          const timeProgress = elapsed / total;
          const targetAmount = Number(g.targetAmount) || 1;
          const currentAmount = Number(g.currentAmount) || 0;
          const amountProgress = currentAmount / targetAmount;
          return amountProgress < timeProgress * 0.85;
        });

        if (behindGoal) {
          const targetAmount = Number(behindGoal.targetAmount) || 1;
          const currentAmount = Number(behindGoal.currentAmount) || 0;
          const pct = ((currentAmount / targetAmount) * 100).toFixed(0);
          const res = await this.sendNotification(userId, {
            title: 'Goal Falling Behind',
            body: `${(behindGoal.name as string) || 'Goal'} is at ${pct}% — behind schedule. A top-up now keeps you on track.`,
            url: '/plans?tab=Goals',
          });
          if (res.success) {
            sent++;
          }
        }
      } catch (goalErr) {
        this.logger.warn(`Error checking goals for user ${userId}:`, goalErr);
      }
    }

    this.logger.log(
      `Daily notification dispatch completed. Users checked: ${processed}, Sent: ${sent}`,
    );
    return { processed, sent };
  }
}
