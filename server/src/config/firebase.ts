import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { logger } from '../utils/logger';

function initFirebase(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  // Check for Emulator
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) {
    logger.info('Connecting to Firebase Emulators');
    return admin.initializeApp({
      projectId: env.FIREBASE_PROJECT_ID || 'silversync-demo',
    });
  }

  // Check for direct service account file
  const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : null;

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    logger.info('Initializing Firebase Admin with serviceAccountKey.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || env.FIREBASE_PROJECT_ID,
    });
  }

  // Check for env vars
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    logger.info('Initializing Firebase Admin with environment credentials');
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  // Fallback for local testing or mock runs
  logger.warn('No Firebase credentials found. Initializing with default project for dev/test.');
  return admin.initializeApp({
    projectId: env.FIREBASE_PROJECT_ID || 'silversync-demo',
  });
}

const app = initFirebase();
export const db = admin.firestore(app);
export const auth = admin.auth(app);
export default app;
