import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Check if all required environment variables are present
const firebaseConfigValues = Object.values(firebaseConfig);
const essentialConfigValues = firebaseConfigValues.slice(0, 5); // First 5 are essential (apiKey to messagingSenderId)

export const configComplete = essentialConfigValues.every(value => typeof value === 'string' && value !== '');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (configComplete) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (app) {
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  }
} else {
  console.error(
    "CRITICAL: Firebase configuration is incomplete. " +
    "Please ensure all NEXT_PUBLIC_FIREBASE_... variables are set in your .env or .env.local file. " +
    "Firebase services will be unavailable."
  );
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value], index) => index < 5 && (typeof value !== 'string' || value === ''))
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
  if (missingKeys.length > 0) {
    console.error("Missing or empty Firebase config keys:", missingKeys.join(', '));
  }
}

export { app, auth, firestore, storage, googleProvider };
