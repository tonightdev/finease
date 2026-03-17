import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ActivityType } from '@repo/types';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { SignupDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { ActivityLogService } from '../common/services/activity-log.service';

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  password: string;
  gender?: string;
  dob?: string;
  role: string;
  userType?: string;
  createdAt: string;
}

@Injectable()
export class AuthService {
  private readonly collectionName = 'users';
  private readonly sessionsCollection = 'sessions';

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly jwtService: JwtService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
  }

  private get sessionCollection() {
    return this.firebaseAdmin
      .getFirestore()
      .collection(this.sessionsCollection);
  }

  async signup(data: SignupDto) {
    const { email, password, name, gender, dob } = data;

    // Check if user exists
    const existingUser = await this.collection
      .where('email', '==', email)
      .get();
    if (!existingUser.empty) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Firestore
    const userRef = this.collection.doc();
    const newUser = {
      id: userRef.id,
      email,
      displayName: name,
      password: hashedPassword, // Store hashed password
      gender,
      dob,
      role: 'user',
      hasOnboarded: false,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    await userRef.set(newUser);

    // Generate token
    const token = this.jwtService.sign({
      uid: userRef.id,
      email,
      role: newUser.role,
    });

    // Store session in DB
    await this.createSession(userRef.id, token);

    // Log activity
    await this.activityLogService.logActivity({
      userId: userRef.id,
      action: 'signup' as ActivityType,
      entityType: 'user',
      entityId: userRef.id,
      description: `New user signed up: ${name}`,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userProfile } = newUser;
    return { user: userProfile, token };
  }

  async login(data: LoginDto) {
    const { email, password } = data;

    if (!email) {
      throw new UnauthorizedException('Email is required');
    }

    const snapshot = await this.collection.where('email', '==', email).get();

    if (snapshot.empty) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDoc = snapshot.docs[0];
    if (!userDoc) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userData = userDoc.data() as StoredUser & {
      deletedAt?: string | null;
    };
    if (userData.deletedAt) {
      throw new UnauthorizedException('Identity has been terminated');
    }
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Correctly determine role from available fields
    let role: string = userData.role || 'user';

    // Hardcoded logic for the specific admin email to ensure they can always access admin panel
    if (userData.email === 'devdpadmin@gmail.com') {
      role = 'admin';
    }

    const lastActiveAt = new Date().toISOString();
    await userDoc.ref.update({ lastActiveAt });

    const token = this.jwtService.sign({
      uid: userDoc.id,
      email: userData.email,
      role: role,
    });

    // Store session in DB
    await this.createSession(userDoc.id, token);

    // Log activity
    await this.activityLogService.logActivity({
      userId: userDoc.id,
      action: 'login' as ActivityType,
      entityType: 'user',
      entityId: userDoc.id,
      description: `User logged in: ${userData.displayName}`,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, id: _id, ...userProfile } = userData;
    return { user: { id: userDoc.id, ...userProfile }, token };
  }

  async resetPassword(data: ResetPasswordDto) {
    const { email, newPassword } = data;

    const snapshot = await this.collection.where('email', '==', email).get();

    if (snapshot.empty) {
      // Return success even if not found to prevent email enumeration
      return { message: 'Password reset successfully' };
    }

    const userDoc = snapshot.docs[0];
    if (!userDoc) {
      return { message: 'Password reset successfully' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userDoc.ref.update({
      password: hashedPassword,
    });

    // Log activity
    await this.activityLogService.logActivity({
      userId: userDoc.id,
      action: 'update' as ActivityType,
      entityType: 'user',
      entityId: userDoc.id,
      description: `User reset their password`,
    });

    return { message: 'Password reset successfully' };
  }

  async generateTokenForUser(uid: string) {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) throw new ConflictException('User not found');
    const userData = doc.data() as StoredUser;

    const token = this.jwtService.sign({
      uid: doc.id,
      email: userData.email,
      role: userData.role || 'user',
    });

    // Store session in DB
    await this.createSession(doc.id, token);

    return token;
  }

  private async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session persistence

    await this.sessionCollection.doc(token).set({
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
  }

  async logout(token: string): Promise<void> {
    await this.sessionCollection.doc(token).delete();
  }

  async getSessionsForUser(userId: string) {
    const snapshot = await this.sessionCollection
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async revokeSession(userId: string, targetToken: string) {
    const doc = await this.sessionCollection.doc(targetToken).get();
    if (!doc.exists) {
      throw new ConflictException('Session not found');
    }
    const sessionData = doc.data();
    if (!sessionData || sessionData.userId !== userId) {
      throw new UnauthorizedException('Access denied');
    }
    await doc.ref.delete();

    // Log activity
    await this.activityLogService.logActivity({
      userId,
      action: 'delete' as ActivityType,
      entityType: 'session',
      entityId: userId,
      description: `User revoked an active session`,
    });

    return { message: 'Session revoked successfully' };
  }
}
