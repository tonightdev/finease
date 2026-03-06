import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { Reminder } from '@repo/types';

@Injectable()
export class RemindersService {
  private readonly collectionName = 'reminders';

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Partial<Reminder>;
      return {
        id: doc.id,
        userId: data.userId ?? '',
        name: data.name ?? '',
        type: data.type ?? 'other',
        expiryDate: data.expiryDate ?? new Date().toISOString(),
        renewalAmount: data.renewalAmount ?? 0,
        metadata: data.metadata ?? {},
        createdAt: data.createdAt ?? new Date().toISOString(),
      } as Reminder;
    });
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
    await reminderRef.update(data);
    const updated = await reminderRef.get();
    const updatedData = updated.data() as Partial<Reminder> | undefined;
    return {
      id: updated.id,
      userId: updatedData?.userId ?? '',
      name: updatedData?.name ?? '',
      type: updatedData?.type ?? 'other',
      expiryDate: updatedData?.expiryDate ?? new Date().toISOString(),
      renewalAmount: updatedData?.renewalAmount ?? 0,
      metadata: updatedData?.metadata ?? {},
      createdAt: updatedData?.createdAt ?? new Date().toISOString(),
    } as Reminder;
  }

  async deleteReminder(userId: string, reminderId: string): Promise<void> {
    await this.collection.doc(reminderId).delete();
  }
}
