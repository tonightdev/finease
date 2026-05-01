import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { Expiry, ActivityType } from '@repo/types';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class ExpiriesService {
  private readonly collectionName = 'expiries';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection(): admin.firestore.CollectionReference<Expiry> {
    return this.firebaseAdmin
      .getFirestore()
      .collection(
        this.collectionName,
      ) as admin.firestore.CollectionReference<Expiry>;
  }

  async getExpiries(userId: string): Promise<Expiry[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc: admin.firestore.QueryDocumentSnapshot<Expiry>) => {
        const raw = doc.data() as unknown as Record<string, unknown>;
        const expiry: Expiry = {
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
        return expiry;
      })
      .filter((expiry) => !expiry.deletedAt);
  }

  async createExpiry(userId: string, data: Partial<Expiry>): Promise<Expiry> {
    const expiryRef = this.collection.doc();
    const now = new Date().toISOString();
    const newExpiry: Expiry = {
      id: expiryRef.id,
      userId,
      name: data.name ?? '',
      type: data.type ?? 'policy',
      expiryDate: data.expiryDate ?? now,
      renewalAmount: data.renewalAmount ?? 0,
      metadata: (data.metadata as Record<string, unknown>) ?? {},
      createdAt: now,
      deletedAt: null,
    };
    await expiryRef.set(newExpiry);
    return newExpiry;
  }

  async updateExpiry(
    userId: string,
    expiryId: string,
    data: Partial<Expiry>,
  ): Promise<Expiry> {
    const expiryRef = this.collection.doc(expiryId);
    const doc = await expiryRef.get();

    if (!doc.exists || doc.data()?.userId !== userId || doc.data()?.deletedAt) {
      throw new Error('Expiry not found or unauthorized');
    }

    const prevExpiry = this.mapDocToExpiry(doc);

    await expiryRef.update(data);
    const updated = await expiryRef.get();
    const currentExpiry = this.mapDocToExpiry(updated);

    // Log activity
    await this.activityLogService.logActivity({
      userId,
      action: 'update' as ActivityType,
      entityType: 'expiry',
      entityId: expiryId,
      description: `Updated expiry: ${currentExpiry.name}`,
      previousState: prevExpiry,
      newState: currentExpiry,
    });

    return currentExpiry;
  }

  private mapDocToExpiry(
    doc: admin.firestore.DocumentSnapshot<Expiry>,
  ): Expiry {
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

  async deleteExpiry(
    userId: string,
    expiryId: string,
    hard = false,
  ): Promise<void> {
    const expiryRef = this.collection.doc(expiryId);
    const doc = await expiryRef.get();

    if (doc.exists && doc.data()?.userId === userId) {
      if (hard) {
        await expiryRef.delete();
      } else {
        await expiryRef.update({
          deletedAt: new Date().toISOString(),
        });
      }
    }
  }

  async getArchivedExpiries(userId: string): Promise<Expiry[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();

    return snapshot.docs
      .map((doc: admin.firestore.QueryDocumentSnapshot<Expiry>) => {
        return this.mapDocToExpiry(doc);
      })
      .filter((expiry) => !!expiry.deletedAt)
      .sort((a, b) => {
        const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return dateB - dateA;
      });
  }
}
