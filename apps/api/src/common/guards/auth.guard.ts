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
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new UnauthorizedException('JWT_SECRET configuration missing');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
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

      // Update last active and keep session extended (10 years)
      const updates: Record<string, any> = {
        lastActiveAt: new Date().toISOString(),
      };
      if (sessionData?.expiresAt) {
        const expDate = new Date(sessionData.expiresAt);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (expDate < oneYearFromNow) {
          const newExp = new Date();
          newExp.setFullYear(newExp.getFullYear() + 10);
          updates.expiresAt = newExp.toISOString();
        }
      }
      await sessionDoc.ref.update(updates);

      (request as RequestWithUser).user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
