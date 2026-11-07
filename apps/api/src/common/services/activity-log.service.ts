import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { ActivityLog, ActivityType } from '@repo/types';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);
  private static readonly userCache = new Map<
    string,
    { email: string; displayName: string; cachedAt: number }
  >();
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 mins

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async logActivity(params: {
    userId: string;
    action: ActivityType;
    entityType: string;
    entityId?: string;
    description: string;
    metadata?: Record<string, unknown>;
    previousState?: unknown;
    newState?: unknown;
  }): Promise<void> {
    try {
      const db = this.firebaseAdmin.getFirestore();

      // Check cached user info to eliminate redundant Firestore reads
      const now = Date.now();
      let userData = ActivityLogService.userCache.get(params.userId);

      if (!userData || now - userData.cachedAt > ActivityLogService.CACHE_TTL) {
        const userDoc = await db.collection('users').doc(params.userId).get();
        const raw = userDoc.data() as {
          email?: string;
          displayName?: string;
        } | null;

        userData = {
          email: raw?.email || 'unknown',
          displayName: raw?.displayName || 'Unknown User',
          cachedAt: now,
        };
        if (ActivityLogService.userCache.size >= 500) {
          const firstKey = ActivityLogService.userCache.keys().next().value;
          if (firstKey) ActivityLogService.userCache.delete(firstKey);
        }
        ActivityLogService.userCache.set(params.userId, userData);
      }

      const activityLog: ActivityLog = {
        userId: params.userId,
        userEmail: userData.email,
        userName: userData.displayName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata,
        previousState: params.previousState,
        newState: params.newState,
        timestamp: new Date().toISOString(),
      };

      await db.collection('activity_logs').add(activityLog);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to log activity: ${err.message}`, err.stack);
    }
  }
}
