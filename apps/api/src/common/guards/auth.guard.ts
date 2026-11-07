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

interface CachedSession {
  payload: JwtPayload;
  expiresAt: number;
  cachedAt: number;
  lastActiveAtMs: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private static readonly sessionCache = new Map<string, CachedSession>();
  private static readonly CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes in-memory cache
  private static readonly ACTIVITY_THROTTLE_MS = 15 * 60 * 1000; // Update lastActiveAt at most once every 15 minutes
  private static readonly MAX_CACHE_SIZE = 1000;

  private static pruneSessionCache() {
    if (AuthGuard.sessionCache.size >= AuthGuard.MAX_CACHE_SIZE) {
      const now = Date.now();
      // Evict expired entries
      for (const [key, val] of AuthGuard.sessionCache.entries()) {
        if (
          now - val.cachedAt > AuthGuard.CACHE_TTL_MS ||
          val.expiresAt <= now
        ) {
          AuthGuard.sessionCache.delete(key);
        }
      }
      // If still near capacity, delete oldest 200 keys
      if (AuthGuard.sessionCache.size >= AuthGuard.MAX_CACHE_SIZE - 100) {
        let count = 0;
        for (const key of AuthGuard.sessionCache.keys()) {
          AuthGuard.sessionCache.delete(key);
          count++;
          if (count >= 200) break;
        }
      }
    }
  }

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

      const now = Date.now();
      const cached = AuthGuard.sessionCache.get(token);

      // Fast-path: Valid memory cache hit (eliminates concurrent Firestore read/write contention)
      if (
        cached &&
        now - cached.cachedAt < AuthGuard.CACHE_TTL_MS &&
        cached.expiresAt > now
      ) {
        // Throttled asynchronous background update for last active timestamp
        if (now - cached.lastActiveAtMs > AuthGuard.ACTIVITY_THROTTLE_MS) {
          cached.lastActiveAtMs = now;
          this.firebaseAdmin
            .getFirestore()
            .collection('sessions')
            .doc(token)
            .update({ lastActiveAt: new Date().toISOString() })
            .catch(() => {});
        }
        (request as RequestWithUser).user = cached.payload;
        return true;
      }

      // Slow-path: Validate session in Firestore DB
      const sessionRef = this.firebaseAdmin
        .getFirestore()
        .collection('sessions')
        .doc(token);

      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        AuthGuard.sessionCache.delete(token);
        throw new UnauthorizedException('Session expired or revoked');
      }

      const sessionData = sessionDoc.data() as
        | { expiresAt: string; lastActiveAt?: string }
        | undefined;

      const sessionExpiresAt = sessionData?.expiresAt
        ? new Date(sessionData.expiresAt).getTime()
        : 0;

      if (sessionExpiresAt && sessionExpiresAt < now) {
        AuthGuard.sessionCache.delete(token);
        sessionRef.delete().catch(() => {});
        throw new UnauthorizedException('Session expired');
      }

      const lastActiveMs = sessionData?.lastActiveAt
        ? new Date(sessionData.lastActiveAt).getTime()
        : 0;

      // Only perform DB write if lastActiveAt is older than throttle window
      if (now - lastActiveMs > AuthGuard.ACTIVITY_THROTTLE_MS) {
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

        // Fire-and-forget in background without blocking API request latency
        sessionRef.update(updates).catch(() => {});
      }

      // Store verified session in cache (with bounded size protection)
      AuthGuard.pruneSessionCache();
      AuthGuard.sessionCache.set(token, {
        payload,
        expiresAt: sessionExpiresAt || now + 30 * 24 * 60 * 60 * 1000,
        cachedAt: now,
        lastActiveAtMs: now,
      });

      (request as RequestWithUser).user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
