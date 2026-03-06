import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { SignupDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';

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

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly jwtService: JwtService,
  ) {}

  private get collection() {
    return this.firebaseAdmin.getFirestore().collection(this.collectionName);
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
      createdAt: new Date().toISOString(),
    };

    await userRef.set(newUser);

    // Generate token
    const token = this.jwtService.sign({
      uid: userRef.id,
      email,
      role: newUser.role,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userProfile } = newUser;
    return { user: userProfile, token };
  }

  async login(data: LoginDto) {
    const { email, password } = data;

    const snapshot = await this.collection.where('email', '==', email).get();

    if (snapshot.empty) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDoc = snapshot.docs[0];
    if (!userDoc) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userData = userDoc.data() as StoredUser;
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

    return { message: 'Password reset successfully' };
  }
}
