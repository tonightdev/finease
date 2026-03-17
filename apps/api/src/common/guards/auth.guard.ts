import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseAdminService } from '../services/firebase-admin.service';
import { Request } from 'express';
import type {
  JwtPayload,
  RequestWithUser,
} from '../interfaces/request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET ?? 'finease-secret-fallback',
      });

      // Validate session in DB
      const sessionDoc = await this.firebaseAdmin
        .getFirestore()
        .collection('sessions')
        .doc(token)
        .get();

      if (!sessionDoc.exists) {
        throw new UnauthorizedException('Session expired or revoked');
      }

      const sessionData = sessionDoc.data() as
        | { expiresAt: string }
        | undefined;
      if (sessionData && new Date(sessionData.expiresAt) < new Date()) {
        await sessionDoc.ref.delete();
        throw new UnauthorizedException('Session expired');
      }

      // Update last active
      await sessionDoc.ref.update({ lastActiveAt: new Date().toISOString() });

      (request as RequestWithUser).user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
