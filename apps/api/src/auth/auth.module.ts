import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'finease-secret-fallback',
        signOptions: { expiresIn: '3650d' },
      }),
    }),
  ],
  controllers: [AuthController, NotificationsController],
  providers: [AuthService, NotificationsService],
  exports: [AuthService, NotificationsService, JwtModule],
})
export class AuthModule {}
