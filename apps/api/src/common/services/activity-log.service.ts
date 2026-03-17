import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { ActivityLog, ActivityType } from '@repo/types';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

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

      // Fetch user details for the log
      const userDoc = await db.collection('users').doc(params.userId).get();
      const userData = userDoc.data() as {
        email?: string;
        displayName?: string;
      } | null;

      const activityLog: ActivityLog = {
        userId: params.userId,
        userEmail: userData?.email || 'unknown',
        userName: userData?.displayName || 'Unknown User',
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
