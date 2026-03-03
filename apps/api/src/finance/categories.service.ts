import { Injectable, BadRequestException } from '@nestjs/common';
import { Category } from '@repo/types';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';

@Injectable()
export class CategoriesService {
  private readonly collectionName = 'categories';
  private readonly transactionsCollection = 'transactions';

  constructor(private readonly firebase: FirebaseAdminService) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  async findAll(userId: string): Promise<Category[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Category, 'id'>),
    }));
  }

  async create(category: Partial<Category>): Promise<Category> {
    const docRef = await this.collection.add(category);
    const doc = await docRef.get();
    return { id: doc.id, ...(doc.data() as Omit<Category, 'id'>) };
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    await this.collection.doc(id).update(category);
    const doc = await this.collection.doc(id).get();
    return { id: doc.id, ...(doc.data() as Omit<Category, 'id'>) };
  }

  async remove(id: string): Promise<void> {
    // Check if any transaction is using this category
    const transactionsSnapshot = await this.db
      .collection(this.transactionsCollection)
      .where('category', '==', id)
      .limit(1)
      .get();

    if (!transactionsSnapshot.empty) {
      throw new BadRequestException(
        'Cannot delete Category: it is still associated with one or more transactions. Please update those transactions first.',
      );
    }

    await this.collection.doc(id).delete();
  }
}
