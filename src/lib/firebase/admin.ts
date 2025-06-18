
// Ruta: src/lib/firebase/admin.ts

import admin from 'firebase-admin';
import type { App, AppOptions } from 'firebase-admin/app';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';

export const ADMIN_APP_NAME = 'TESLATECH_ADMIN_APP_V3_SINGLETON_FINAL';

let adminAppInstance: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: Storage | null = null;

console.log(`Firebase Admin SDK: admin.ts module evaluating... ADMIN_APP_NAME: ${ADMIN_APP_NAME}`);

const projectIdEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmailEnv = process.env.PRIVATE_FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyInputEnv = process.env.PRIVATE_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

if (!projectIdEnv || projectIdEnv.trim() === "" || !clientEmailEnv || !privateKeyInputEnv) {
    const errorParts = [
        (!projectIdEnv || projectIdEnv.trim() === "") && "PROJECT_ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID) is missing or empty",
        !clientEmailEnv && "CLIENT_EMAIL (PRIVATE_FIREBASE_CLIENT_EMAIL or FIREBASE_CLIENT_EMAIL) is missing",
        !privateKeyInputEnv && "PRIVATE_KEY (PRIVATE_FIREBASE_PRIVATE_KEY or FIREBASE_PRIVATE_KEY) is missing"
    ].filter(Boolean).join('; ');
    const errorMessage = `Firebase Admin SDK: CRITICAL - Missing or empty environment variables for Admin SDK initialization: ${errorParts}. Module will not initialize.`;
    console.error(errorMessage);
    throw new Error(errorMessage); 
}
const privateKeyEnv = privateKeyInputEnv.replace(/\\n/g, '\n');

function initializeAdminAppInternal(): App {
    console.log(`Firebase Admin SDK: initializeAdminAppInternal() called. Current apps: ${admin.apps.length}, looking for "${ADMIN_APP_NAME}".`);

    const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);
    if (existingApp) {
        console.log(`Firebase Admin SDK: Using existing app named "${ADMIN_APP_NAME}" with projectId: ${existingApp.options?.projectId || 'UNKNOWN (existingApp.options.projectId is undefined)'}`);
        if (!existingApp.options?.projectId || existingApp.options.projectId.trim() === "") {
            console.error(`Firebase Admin SDK: CRITICAL - Existing app "${ADMIN_APP_NAME}" is malformed (missing or empty projectId). Options: ${JSON.stringify(existingApp.options, (k,v) => k === 'privateKey' ? '[REDACTED]' : v)}`);
            throw new Error(`Firebase Admin SDK: Existing app "${ADMIN_APP_NAME}" is malformed (missing or empty projectId).`);
        }
        adminAppInstance = existingApp; // Ensure module-level instance is set if it's valid
        return existingApp;
    }

    const appOptions: AppOptions = {
        credential: admin.credential.cert({
            projectId: projectIdEnv,
            clientEmail: clientEmailEnv,
            privateKey: privateKeyEnv,
        }),
        projectId: projectIdEnv, // Explicitly pass projectId here too
    };
    
    console.log(`Firebase Admin SDK: No app named "${ADMIN_APP_NAME}" found. Attempting to initialize with name, using projectIdEnv: ${projectIdEnv}. AppOptions: ${JSON.stringify(appOptions, (k,v) => k === 'privateKey' ? '[REDACTED]' : v)}`);
    
    try {
        const newApp = admin.initializeApp(appOptions, ADMIN_APP_NAME);
        
        if (!newApp || !newApp.options || !newApp.options.projectId || newApp.options.projectId.trim() === "") {
            console.error(`Firebase Admin SDK: CRITICAL - Newly initialized app "${ADMIN_APP_NAME}" options or projectId is missing/empty. Options: ${JSON.stringify(newApp?.options, (k,v) => k === 'privateKey' ? '[REDACTED]' : v)}. Credential used: projectId=${projectIdEnv}, clientEmail=${clientEmailEnv}`);
            // Attempt to clean up if partial initialization occurred
            newApp?.delete().catch(err => console.error(`Firebase Admin SDK: Error deleting partially initialized app ${ADMIN_APP_NAME}`, err));
            throw new Error(`Firebase Admin SDK: Newly initialized app "${ADMIN_APP_NAME}" is malformed (missing or empty projectId in options).`);
        }
        console.log(`Firebase Admin SDK: Initialized new app named "${ADMIN_APP_NAME}" for project: ${newApp.options.projectId}`);
        adminAppInstance = newApp; 
        return newApp;

    } catch (initError: any) {
        console.error(`Firebase Admin SDK: CRITICAL ERROR during initializeApp("${ADMIN_APP_NAME}"):`, initError.message, initError.code, initError.stack);
        if (initError.code === 'app/duplicate-app') {
            console.warn(`Firebase Admin SDK: App named "${ADMIN_APP_NAME}" already exists (caught duplicate-app). Attempting to retrieve it.`);
            try {
                const retrievedApp = admin.app(ADMIN_APP_NAME);
                 if (!retrievedApp.options?.projectId || retrievedApp.options.projectId.trim() === "") {
                    console.error(`Firebase Admin SDK: CRITICAL - Retrieved duplicate app "${ADMIN_APP_NAME}" but it has a missing or empty projectId. Options: ${JSON.stringify(retrievedApp.options)}`);
                    throw new Error(`Firebase Admin SDK: Retrieved duplicate app "${ADMIN_APP_NAME}" is malformed (missing or empty projectId).`);
                }
                console.log(`Firebase Admin SDK: Successfully retrieved existing app named "${ADMIN_APP_NAME}" after duplicate error for project: ${retrievedApp.options.projectId}`);
                adminAppInstance = retrievedApp;
                return retrievedApp;
            } catch (getAppError: any) {
                console.error(`Firebase Admin SDK: CRITICAL ERROR - Failed to retrieve app named "${ADMIN_APP_NAME}" after duplicate-app error:`, getAppError.message, getAppError.stack);
                throw getAppError; 
            }
        }
        throw initError; 
    }
}

export function getInitializedAdminApp(): App {
    if (!adminAppInstance) {
        console.log(`Firebase Admin SDK: adminAppInstance is null in getInitializedAdminApp. Attempting internal initialization for "${ADMIN_APP_NAME}".`);
        adminAppInstance = initializeAdminAppInternal(); 
    }
    
    if (!adminAppInstance || !adminAppInstance.options?.projectId || adminAppInstance.options.projectId.trim() === "") {
        const appNameForLog = adminAppInstance?.name || ADMIN_APP_NAME;
        const optionsDetail = adminAppInstance?.options ? JSON.stringify(adminAppInstance.options, (k,v) => k === 'privateKey' ? '[REDACTED]' : v) : 'options undefined';
        const instanceDetail = adminAppInstance ? `instance for ${appNameForLog} exists` : `no instance for ${appNameForLog}`;
        
        console.error(`Firebase Admin SDK: CRITICAL - getInitializedAdminApp has an invalid app state. ${instanceDetail}, but projectId is missing or empty. Options: ${optionsDetail}. Attempted with projectIdEnv: ${projectIdEnv}`);
        
        adminAppInstance = null; 
        throw new Error(`Firebase Admin SDK: Failed to obtain a valid, fully initialized app instance with a non-empty projectId for "${appNameForLog}". Ensure Firebase Admin environment variables (especially project ID) are correctly set and accessible with a non-empty value.`);
    }
    return adminAppInstance;
}

export function getFirestoreAdmin(): Firestore {
    const app = getInitializedAdminApp(); 
    if (!firestoreInstance) {
        try {
            console.log(`Firebase Admin SDK: Attempting to get Firestore service from app "${app.name}" (Project: ${app.options.projectId}).`);
            firestoreInstance = admin.firestore(app);
            firestoreInstance.settings({ ignoreUndefinedProperties: true });
            console.log(`Firebase Admin SDK: Firestore service successfully obtained/initialized from app "${app.name}" for project: ${app.options.projectId}.`);
            
            firestoreInstance.listCollections().then((collections) => {
                 console.log(`Firebase Admin SDK: Firestore service accessible (listCollections test on project ${app.options.projectId} returned ${collections.length} collections).`);
            }).catch(e => {
                 console.error(`Firebase Admin SDK: CRITICAL ERROR - Firestore service NOT accessible after init (listCollections test failed for project ${app.options.projectId}). Error: ${e.message}`, e.stack);
            });
        } catch (e: any) {
            console.error(`Firebase Admin SDK: CRITICAL ERROR - Firestore service could not be obtained/initialized from app "${app.name}". Error: ${e.message}`, e.stack);
            firestoreInstance = null; // Ensure it's null if init fails
            throw new Error(`Firebase Admin SDK: Firestore service not available. ${e.message}`);
        }
    }
    return firestoreInstance;
}

export function getAuthAdmin(): Auth {
    const app = getInitializedAdminApp();
    if (!authInstance) {
        try {
            console.log(`Firebase Admin SDK: Attempting to get Auth service from app "${app.name}".`);
            authInstance = admin.auth(app);
            console.log(`Firebase Admin SDK: Auth service successfully obtained/initialized from app "${app.name}".`);
        } catch (e: any) {
            console.error(`Firebase Admin SDK: CRITICAL ERROR - Auth service could not be obtained/initialized from app "${app.name}". Error: ${e.message}`, e.stack);
            authInstance = null; // Ensure it's null if init fails
            throw new Error(`Firebase Admin SDK: Auth service not available. ${e.message}`);
        }
    }
    return authInstance;
}

export function getStorageAdmin(): Storage {
  const app = getInitializedAdminApp();
  if (!storageInstance) {
    try {
      console.log(`Firebase Admin SDK: Attempting to get Storage service from app "${app.name}".`);
      storageInstance = admin.storage(app); 
      console.log(`Firebase Admin SDK: Storage service successfully obtained/initialized from app "${app.name}".`);
    } catch (e: any) {
      console.error(`Firebase Admin SDK: CRITICAL ERROR - Storage service could not be obtained/initialized from app "${app.name}". Error: ${e.message}`, e.stack);
      storageInstance = null; // Ensure it's null if init fails
      throw new Error(`Firebase Admin SDK: Storage service not available. ${e.message}`);
    }
  }
  return storageInstance;
}

// Eager initialization attempt - this should now be more robust
try {
    if (typeof process !== 'undefined' && !(process.env.NODE_ENV === 'test')) {
        // Calling getInitializedAdminApp() will set adminAppInstance or throw
        const initializedApp = getInitializedAdminApp(); 
        console.log(`Firebase Admin SDK: Eager initialization for app "${ADMIN_APP_NAME}" (via getInitializedAdminApp) successful. Project ID: ${initializedApp.options.projectId}`);
    }
} catch (e: any) {
    console.warn(`Firebase Admin SDK: Warning during initial eager initialization of app "${ADMIN_APP_NAME}":`, e.message);
}

export default admin;
