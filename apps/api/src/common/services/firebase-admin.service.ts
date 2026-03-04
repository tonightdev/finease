import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey) {
        // Remove surrounding quotes if they exist (common when copying from JSON/dashboard)
        privateKey = privateKey.trim();
        if (
          (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
          (privateKey.startsWith("'") && privateKey.endsWith("'"))
        ) {
          privateKey = privateKey.slice(1, -1);
        }

        // Replace literal \n string with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          'Missing Firebase configuration. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in Vercel/env.',
        );
      }

      this.logger.log(`Initializing Firebase Admin for project: ${projectId}`);

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });

      admin.firestore().settings({ ignoreUndefinedProperties: true });
    }
  }

  getAuth(): admin.auth.Auth {
    return admin.auth();
  }

  getFirestore(): admin.firestore.Firestore {
    return admin.firestore();
  }
}
