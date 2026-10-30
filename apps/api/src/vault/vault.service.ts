import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import type {
  VaultSettings,
  VaultItem,
  SetupVaultDto,
  CreateVaultItemDto,
  UpdateVaultItemDto,
} from '@repo/types';

@Injectable()
export class VaultService {
  private readonly settingsCollectionName = 'vault_settings';
  private readonly itemsCollectionName = 'vault_items';

  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  private get settingsCollection() {
    return this.db.collection(this.settingsCollectionName);
  }

  private get itemsCollection() {
    return this.db.collection(this.itemsCollectionName);
  }

  // --- Vault Settings ---
  async getSettings(userId: string): Promise<VaultSettings | null> {
    const doc = await this.settingsCollection.doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as VaultSettings;
  }

  async setupVault(userId: string, dto: SetupVaultDto): Promise<VaultSettings> {
    if (!dto.vaultSalt || !dto.passwordVerifier || !dto.verifierIv) {
      throw new BadRequestException(
        'Missing required cryptographic parameters (salt, verifier, or iv)',
      );
    }

    const now = new Date().toISOString();
    const data: VaultSettings = {
      userId,
      vaultSalt: dto.vaultSalt,
      passwordVerifier: dto.passwordVerifier,
      verifierIv: dto.verifierIv,
      createdAt: now,
      updatedAt: now,
    };

    await this.settingsCollection.doc(userId).set(data);

    await this.activityLogService.logActivity({
      userId,
      action: 'create',
      entityType: 'vault_settings',
      entityId: userId,
      description: 'Initialized encrypted credential vault',
    });

    return data;
  }

  async resetVault(userId: string): Promise<{ success: boolean }> {
    // 1. Delete all user items in batch
    const snapshot = await this.itemsCollection
      .where('userId', '==', userId)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    // Delete settings
    batch.delete(this.settingsCollection.doc(userId));
    await batch.commit();

    await this.activityLogService.logActivity({
      userId,
      action: 'delete',
      entityType: 'vault',
      entityId: userId,
      description: 'Reset and wiped credential vault',
    });

    return { success: true };
  }

  // --- Vault Items ---
  async findAll(userId: string): Promise<VaultItem[]> {
    const snapshot = await this.itemsCollection
      .where('userId', '==', userId)
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<VaultItem, 'id'>),
    }));

    return items.sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
  }

  async findOne(userId: string, id: string): Promise<VaultItem> {
    const doc = await this.itemsCollection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException('Vault item not found');
    }
    const data = doc.data() as Omit<VaultItem, 'id'>;
    if (data.userId !== userId) {
      throw new ForbiddenException('Access denied to this vault item');
    }
    return { id: doc.id, ...data };
  }

  async create(userId: string, dto: CreateVaultItemDto): Promise<VaultItem> {
    if (!dto.title || !dto.encryptedPassword || !dto.iv) {
      throw new BadRequestException(
        'Title, encrypted password, and IV are required',
      );
    }

    const now = new Date().toISOString();
    const itemData = {
      userId,
      title: dto.title.trim(),
      category: dto.category || 'other',
      websiteUrl: dto.websiteUrl ? dto.websiteUrl.trim() : '',
      encryptedUsername: dto.encryptedUsername || '',
      encryptedPassword: dto.encryptedPassword,
      iv: dto.iv,
      notes: dto.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.itemsCollection.add(itemData);
    const result: VaultItem = { id: docRef.id, ...itemData };

    await this.activityLogService.logActivity({
      userId,
      action: 'create',
      entityType: 'vault_item',
      entityId: docRef.id,
      description: `Saved encrypted credential for ${dto.title}`,
    });

    return result;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateVaultItemDto,
  ): Promise<VaultItem> {
    const existing = await this.findOne(userId, id);

    const updates: Partial<VaultItem> = {
      updatedAt: new Date().toISOString(),
    };

    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.websiteUrl !== undefined)
      updates.websiteUrl = dto.websiteUrl.trim();
    if (dto.encryptedUsername !== undefined)
      updates.encryptedUsername = dto.encryptedUsername;
    if (dto.encryptedPassword !== undefined)
      updates.encryptedPassword = dto.encryptedPassword;
    if (dto.iv !== undefined) updates.iv = dto.iv;
    if (dto.notes !== undefined) updates.notes = dto.notes;

    await this.itemsCollection.doc(id).update(updates);

    await this.activityLogService.logActivity({
      userId,
      action: 'update',
      entityType: 'vault_item',
      entityId: id,
      description: `Updated encrypted credential for ${updates.title || existing.title}`,
    });

    return { ...existing, ...updates };
  }

  async delete(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.findOne(userId, id);
    await this.itemsCollection.doc(id).delete();

    await this.activityLogService.logActivity({
      userId,
      action: 'delete',
      entityType: 'vault_item',
      entityId: id,
      description: `Deleted credential for ${existing.title}`,
    });

    return { success: true };
  }
}
