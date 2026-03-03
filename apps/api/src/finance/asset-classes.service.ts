import { Injectable, BadRequestException } from '@nestjs/common';
import { AssetClass } from '@repo/types';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';

@Injectable()
export class AssetClassesService {
  private readonly collectionName = 'asset_classes';
  private readonly accountsCollection = 'accounts';

  constructor(private readonly firebase: FirebaseAdminService) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  async findAll(userId: string): Promise<AssetClass[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<AssetClass, 'id'>),
    }));
  }

  async create(assetClass: Partial<AssetClass>): Promise<AssetClass> {
    const docRef = await this.collection.add(assetClass);
    const doc = await docRef.get();
    return { id: doc.id, ...(doc.data() as Omit<AssetClass, 'id'>) };
  }

  async update(
    id: string,
    assetClass: Partial<AssetClass>,
  ): Promise<AssetClass> {
    await this.collection.doc(id).update(assetClass);
    const doc = await this.collection.doc(id).get();
    return { id: doc.id, ...(doc.data() as Omit<AssetClass, 'id'>) };
  }

  async remove(id: string): Promise<void> {
    // Check if any account is using this asset class
    const accountsSnapshot = await this.db
      .collection(this.accountsCollection)
      .where('assetType', '==', id)
      .limit(1)
      .get();

    if (!accountsSnapshot.empty) {
      throw new BadRequestException(
        'Cannot delete Asset Class: it is still associated with one or more accounts. Please update those accounts first.',
      );
    }

    await this.collection.doc(id).delete();
  }
}
