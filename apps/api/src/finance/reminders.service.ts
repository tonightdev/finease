import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { Reminder, ActivityType } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class RemindersService {
  private readonly collectionName = 'reminders';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection(): admin.firestore.CollectionReference<Reminder> {
    return this.firebaseAdmin
      .getFirestore()
      .collection(
        this.collectionName,
      ) as admin.firestore.CollectionReference<Reminder>;
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc: admin.firestore.QueryDocumentSnapshot<Reminder>) => {
        const raw = doc.data() as unknown as Record<string, unknown>;
        const reminder: Reminder = {
          id: doc.id,
          userId: (raw.userId as string) || '',
          name: (raw.name as string) || '',
          type: (raw.type as 'policy' | 'document' | 'other') || 'other',
          expiryDate: (raw.expiryDate as string) || new Date().toISOString(),
          renewalAmount: Number(raw.renewalAmount || 0),
          metadata: (raw.metadata as Record<string, unknown>) || {},
          createdAt: (raw.createdAt as string) || new Date().toISOString(),
          deletedAt: (raw.deletedAt as string | null) || null,
        };
        return reminder;
      })
      .filter((reminder) => !reminder.deletedAt);
  }

  async createReminder(
    userId: string,
    data: Partial<Reminder>,
  ): Promise<Reminder> {
    const reminderRef = this.collection.doc();
    const now = new Date().toISOString();
    const newReminder: Reminder = {
      id: reminderRef.id,
      userId,
      name: data.name ?? '',
      type: data.type ?? 'policy',
      expiryDate: data.expiryDate ?? now,
      renewalAmount: data.renewalAmount ?? 0,
      metadata: (data.metadata as Record<string, unknown>) ?? {},
      createdAt: now,
      deletedAt: null,
    };
    await reminderRef.set(newReminder);
    return newReminder;
  }

  async updateReminder(
    userId: string,
    reminderId: string,
    data: Partial<Reminder>,
  ): Promise<Reminder> {
    const reminderRef = this.collection.doc(reminderId);
    const doc = await reminderRef.get();

    if (!doc.exists || doc.data()?.userId !== userId || doc.data()?.deletedAt) {
      throw new Error('Reminder not found or unauthorized');
    }

    const prevReminder = this.mapDocToReminder(doc);

    await reminderRef.update(data);
    const updated = await reminderRef.get();
    const currentReminder = this.mapDocToReminder(updated);

    // Log activity
    await this.activityLogService.logActivity({
      userId,
      action: 'update' as ActivityType,
      entityType: 'reminder',
      entityId: reminderId,
      description: `Updated reminder: ${currentReminder.name}`,
      previousState: prevReminder,
      newState: currentReminder,
    });

    return currentReminder;
  }

  private mapDocToReminder(
    doc: admin.firestore.DocumentSnapshot<Reminder>,
  ): Reminder {
    const raw = doc.data() as unknown as Record<string, unknown>;
    return {
      id: doc.id,
      userId: (raw?.userId as string) || '',
      name: (raw?.name as string) || '',
      type: (raw?.type as 'policy' | 'document' | 'other') || 'other',
      expiryDate: (raw?.expiryDate as string) || new Date().toISOString(),
      renewalAmount: Number(raw?.renewalAmount || 0),
      metadata: (raw?.metadata as Record<string, unknown>) || {},
      createdAt: (raw?.createdAt as string) || new Date().toISOString(),
      deletedAt: (raw?.deletedAt as string | null) || null,
    };
  }

  async deleteReminder(userId: string, reminderId: string): Promise<void> {
    const reminderRef = this.collection.doc(reminderId);
    const doc = await reminderRef.get();

    if (doc.exists && doc.data()?.userId === userId) {
      await reminderRef.update({
        deletedAt: new Date().toISOString(),
      });
    }
  }

  async getArchivedReminders(userId: string): Promise<Reminder[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();

    return snapshot.docs
      .map((doc: admin.firestore.QueryDocumentSnapshot<Reminder>) => {
        return this.mapDocToReminder(doc);
      })
      .filter((reminder) => !!reminder.deletedAt)
      .sort((a, b) => {
        const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return dateB - dateA;
      });
  }
}
