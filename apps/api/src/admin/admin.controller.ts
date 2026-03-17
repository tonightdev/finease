import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { UsersService } from '../common/services/users.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AuthService } from '../auth/auth.service';
import { User, AdminStats, ActivityType } from '@repo/types';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { ActivityLogService } from '../common/services/activity-log.service';
import { Req } from '@nestjs/common';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly analyticsService: AnalyticsService,
    private readonly authService: AuthService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get('users')
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = user as User & { password?: string };
      return rest as Omit<User, 'password'>;
    });
  }

  @Put('users/:uid')
  async updateUser(
    @Param('uid') uid: string,
    @Body() data: Partial<User>,
  ): Promise<User> {
    return this.usersService.update(uid, data);
  }

  @Get('stats')
  async getAdminStats(): Promise<AdminStats> {
    return this.analyticsService.getAdminStats();
  }

  @Put('users/:uid/reset-onboarding')
  async resetUserOnboarding(@Param('uid') uid: string) {
    return this.usersService.update(uid, { hasOnboarded: false });
  }

  @Get('users/:uid/deleted-items')
  async getDeletedItems(
    @Param('uid') uid: string,
  ): Promise<Record<string, any>[]> {
    const db = this.usersService.getFirestore();
    const collections = [
      'accounts',
      'transactions',
      'goals',
      'categories',
      'asset_classes',
      'reminders',
    ];
    const results: Record<string, any>[] = [];

    for (const collectionName of collections) {
      const snapshot = await db
        .collection(collectionName)
        .where('userId', '==', uid)
        .get();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.deletedAt) {
          results.push({
            id: doc.id,
            collection: collectionName,
            ...data,
          });
        }
      });
    }

    return results;
  }

  @Delete('purge/:collection/:id')
  async purgeItem(
    @Param('collection') collection: string,
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const db = this.usersService.getFirestore();
    const doc = await db.collection(collection).doc(id).get();
    const itemData = doc.exists ? doc.data() : null;

    await db.collection(collection).doc(id).delete();

    await this.activityLogService.logActivity({
      userId: req.user.uid,
      action: 'delete' as ActivityType,
      entityType: collection,
      entityId: id,
      description: `Admin purged item ${id} from ${collection}`,
      previousState: itemData,
    });

    return { message: `Item ${id} purged from ${collection}` };
  }

  @Delete('purge/user/:uid')
  async purgeUserRecords(
    @Param('uid') uid: string,
    @Req() req: RequestWithUser,
  ) {
    const db = this.usersService.getFirestore();
    const collections = [
      'accounts',
      'transactions',
      'goals',
      'categories',
      'asset_classes',
      'reminders',
    ];
    let totalPurged = 0;

    for (const collectionName of collections) {
      const snapshot = await db
        .collection(collectionName)
        .where('userId', '==', uid)
        .get();

      const batch = db.batch();
      let count = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.deletedAt) {
          batch.delete(doc.ref);
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        totalPurged += count;
      }
    }

    await this.activityLogService.logActivity({
      userId: req.user.uid,
      action: 'delete' as ActivityType,
      entityType: 'user_data',
      entityId: uid,
      description: `Admin purged all soft-deleted records for user ${uid}. Total items: ${totalPurged}`,
    });

    return {
      message: `Successfully purged ${totalPurged} soft-deleted records for user ${uid}`,
      totalPurged,
    };
  }

  @Post('users/enable-tour')
  async enableTourForAll(@Req() req: RequestWithUser) {
    return this.usersService.enableTourForAll(req.user.uid);
  }

  @Put('bulk-soft-delete-migration')
  async migrateToSoftDelete(@Req() req: RequestWithUser) {
    const db = this.usersService.getFirestore();
    const collections = [
      'users',
      'accounts',
      'transactions',
      'goals',
      'categories',
      'asset_classes',
      'reminders',
    ];
    let totalUpdated = 0;

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      let count = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as { deletedAt?: string | null };
        if (data.deletedAt === undefined) {
          batch.update(doc.ref, { deletedAt: null });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        totalUpdated += count;
      }
    }

    await this.activityLogService.logActivity({
      userId: req.user.uid,
      action: 'update' as ActivityType,
      entityType: 'system',
      description: `Admin initiated bulk soft-delete migration. Total records updated: ${totalUpdated}`,
    });

    return {
      message: `Soft delete field initialized for ${totalUpdated} records across ${collections.length} collections.`,
      totalUpdated,
    };
  }

  @Post('impersonate/:uid')
  async impersonate(@Param('uid') uid: string, @Req() req: RequestWithUser) {
    const token = await this.authService.generateTokenForUser(uid);

    await this.activityLogService.logActivity({
      userId: req.user.uid,
      action: 'login' as ActivityType,
      entityType: 'user',
      entityId: uid,
      description: `Admin impersonated user ${uid}`,
    });

    return { token };
  }

  @Get('activities')
  async getActivityLogs() {
    return this.analyticsService.getActivityLogs(100);
  }
}
