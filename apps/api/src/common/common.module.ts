import { Global, Module } from '@nestjs/common';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { UsersService } from './services/users.service';
import { ActivityLogService } from './services/activity-log.service';

@Global()
@Module({
  providers: [FirebaseAdminService, UsersService, ActivityLogService],
  exports: [FirebaseAdminService, UsersService, ActivityLogService],
})
export class CommonModule {}
