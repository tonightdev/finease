import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';
import { Account } from '@repo/types';
import { TransactionsService } from './transactions.service';

@Injectable()
export class AccountsService {
  private readonly collectionName = 'accounts';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly transactionsService: TransactionsService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  async findAll(userId: string): Promise<Account[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Account,
    );
  }

  async findOne(id: string): Promise<Account> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() } as Account;
  }

  async create(account: Partial<Account>): Promise<Account> {
    const docRef = await this.collection.add({
      ...account,
      lastSyncedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as Account;
  }

  async update(id: string, account: Partial<Account>): Promise<Account> {
    await this.collection.doc(id).update({
      ...account,
      lastSyncedAt: new Date().toISOString(),
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Cascade delete transactions related to this account
    await this.transactionsService.removeByAccountId(id);
    // Delete the account itself
    await this.collection.doc(id).delete();
  }
}
