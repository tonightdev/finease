import { Injectable } from '@nestjs/common';
import { Category } from '@repo/types';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';

@Injectable()
export class CategoriesService {
  private readonly collectionName = 'categories';

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
    await this.collection.doc(id).delete();
  }
}
