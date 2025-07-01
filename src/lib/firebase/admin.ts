// Ruta: src/lib/firebase/admin.ts

import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

// --- Singleton Pattern for Firebase Admin ---
// We store the initialized app and services in a global object
// to ensure they are not re-initialized on every serverless function invocation.
// This helps prevent issues like the "MaxListenersExceededWarning".

// Define a type for our global cache
interface FirebaseAdminCache {
  app: App | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: Storage | null;
}

// Access the global object or create it if it doesn't exist
const globalWithFirebase = global as typeof global & {
  firebaseAdminCache: FirebaseAdminCache | undefined;
};

// Initialize the cache
if (!globalWithFirebase.firebaseAdminCache) {
  globalWithFirebase.firebaseAdminCache = {
    app: null,
    firestore: null,
    auth: null,
    storage: null,
  };
}
const cache = globalWithFirebase.firebaseAdminCache;


function initializeAdminApp(): App {
  // If the app is already in our cache, return it
  if (cache.app) {
    return cache.app;
  }

  // If the default app is already initialized by another process/library, use it
  if (admin.apps.length > 0 && admin.apps[0]) {
    cache.app = admin.apps[0];
    return cache.app;
  }

  // Check for necessary environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.PRIVATE_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.PRIVATE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin SDK: Missing environment variables for initialization (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY).");
  }

  // Initialize the app and store it in the cache
  cache.app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    }),
  });

  return cache.app;
}


export const getFirestoreAdmin = (): Firestore => {
  if (cache.firestore) {
    return cache.firestore;
  }
  const app = initializeAdminApp();
  cache.firestore = getFirestore(app);
  try {
     cache.firestore.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    // This might throw if settings are already locked, which is fine.
  }
  return cache.firestore;
};

export const getAuthAdmin = (): Auth => {
  if (cache.auth) {
    return cache.auth;
  }
  const app = initializeAdminApp();
  cache.auth = getAuth(app);
  return cache.auth;
};

export const getStorageAdmin = (): Storage => {
  if (cache.storage) {
    return cache.storage;
  }
  const app = initializeAdminApp();
  cache.storage = getStorage(app);
  return cache.storage;
};

export const getInitializedAdminApp = (): App => {
  return initializeAdminApp();
};

export default admin;
