import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Category } from '@repo/types';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { ActivityLogService } from '../common/services/activity-log.service';

@Injectable()
export class CategoriesService {
  private readonly collectionName = 'categories';
  private readonly transactionsCollection = 'transactions';

  constructor(
    private readonly firebase: FirebaseAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  async findAll(userId: string): Promise<Category[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Category, 'id'>),
      }))
      .filter((category) => !category.deletedAt);
  }

  async findOne(id: string, userId?: string): Promise<Category | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = { id: doc.id, ...(doc.data() as Omit<Category, 'id'>) };
    if (userId && data.userId !== userId) {
      throw new ForbiddenException('Access denied to this category');
    }
    return data;
  }

  async create(category: Partial<Category>): Promise<Category> {
    const docRef = await this.collection.add({
      ...category,
      deletedAt: null,
    });
    const doc = await docRef.get();
    const result = { id: doc.id, ...(doc.data() as Omit<Category, 'id'>) };

    // Log activity
    await this.activityLogService.logActivity({
      userId: result.userId,
      action: 'create',
      entityType: 'category',
      entityId: doc.id,
      description: `Created category: ${result.name}`,
    });

    return result;
  }

  async update(
    id: string,
    category: Partial<Category>,
    userId?: string,
  ): Promise<Category> {
    const currentCategory = await this.findOne(id, userId);
    if (!currentCategory) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }

    await this.collection.doc(id).update(category);
    const updatedCategory = await this.findOne(id, userId);
    if (!updatedCategory) {
      throw new NotFoundException(
        `Category with ID ${id} not found after update.`,
      );
    }

    // Log activity
    await this.activityLogService.logActivity({
      userId: updatedCategory.userId,
      action: 'update',
      entityType: 'category',
      entityId: id,
      description: `Updated category: ${updatedCategory.name}`,
      previousState: currentCategory,
      newState: updatedCategory,
    });

    return updatedCategory;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const category = await this.findOne(id, userId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }

    // Check if any active transaction is using this category
    const transactionsSnapshot = await this.db
      .collection(this.transactionsCollection)
      .where('category', '==', id)
      .get();

    const activeTransactions = transactionsSnapshot.docs.filter(
      (doc) => !(doc.data() as { deletedAt?: string | null }).deletedAt,
    );

    if (activeTransactions.length > 0) {
      throw new BadRequestException(
        'Cannot archive Category: it is still associated with one or more active transactions. Please update those transactions first.',
      );
    }

    await this.collection.doc(id).update({
      deletedAt: new Date().toISOString(),
    });

    // Fetch details for logging
    const categoryDoc = await this.collection.doc(id).get();
    const categoryData = categoryDoc.data() as Category;

    // Log activity
    await this.activityLogService.logActivity({
      userId: categoryData.userId,
      action: 'delete',
      entityType: 'category',
      entityId: id,
      description: `Deleted category: ${categoryData.name}`,
    });
  }
}
