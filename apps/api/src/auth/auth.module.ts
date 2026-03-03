import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@auth/auth.service';
import { AuthController } from '@auth/auth.controller';
import { FirebaseAdminService } from '@common/services/firebase-admin.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'finease-secret-fallback',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAdminService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
