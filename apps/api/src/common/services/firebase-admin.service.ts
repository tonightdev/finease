import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      // In a real scenario, the user would provide a service account JSON.
      // For now, we initialize it using ADC (Application Default Credentials)
      // or placeholder if PROJECT_ID is available.
      admin.initializeApp({
        projectId: 'finease-d7e51',
      });
    }
  }

  getAuth(): admin.auth.Auth {
    return admin.auth();
  }

  getFirestore(): admin.firestore.Firestore {
    return admin.firestore();
  }
}
