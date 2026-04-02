import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'finease-secret-fallback',
        signOptions: { expiresIn: '365d' },
      }),
    }),
  ],
  controllers: [AuthController, NotificationsController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
