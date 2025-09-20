import * as admin from 'firebase-admin';

// Firebase Admin configuration
const firebaseAdminConfig = {
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

// Initialize Firebase Admin
const adminApp = admin.apps.length === 0 ? admin.initializeApp(firebaseAdminConfig) : admin.apps[0];

// Initialize Firebase Admin services
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();

export default adminApp;

/*
SETUP INSTRUCTIONS:

1. Download your Firebase service account key JSON file from:
   https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/serviceaccounts/adminsdk

2. Place the JSON file in your project root as 'firebase-service-account.json'

3. Add these environment variables to your .env.local file:
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

4. For production, use environment variables or a secure key management service
   instead of storing the JSON file directly in your codebase.

5. Make sure to add 'firebase-service-account.json' to your .gitignore file.
*/
