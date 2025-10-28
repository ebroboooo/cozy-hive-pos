import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'server-only';

// IMPORTANT: Edit the following lines to provide the service account credentials
// and any necessary environment variables. This is a one-time setup.
// --- START ONE-TIME-SETUP ---
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
// --- END ONE-TIME-SETUP ---

const appName = 'firebase-admin-app';

export function initializeFirebaseAdmin() {
  if (!serviceAccountString) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized.'
    );
    return null;
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    const alreadyCreated = getApps().find(app => app.name === appName);
    
    if (alreadyCreated) {
      return getFirestore(alreadyCreated);
    }
    
    const app = initializeApp({
      credential: cert(serviceAccount)
    }, appName);

    return getFirestore(app);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e);
    } else {
      console.error("Failed to initialize Firebase Admin SDK.", e);
    }
    return null;
  }
}
