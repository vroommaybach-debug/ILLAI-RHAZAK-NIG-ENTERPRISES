import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Resolves Firebase public web configuration from VITE_FIREBASE_* environment variables
 * with fallback to the provisioned firebase-applet-config.json.
 * Fails loudly in development if required keys are missing from both sources.
 */
function resolveFirebaseConfig() {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
    projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
    appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
    firestoreDatabaseId:
      env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId,
  };

  const missingKeys = (
    ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'] as const
  ).filter((k) => !config[k]);

  if (missingKeys.length > 0) {
    const msg = `[Firebase Init] Missing required Firebase configuration keys: ${missingKeys.join(
      ', '
    )}. Set VITE_FIREBASE_* in .env or ensure firebase-applet-config.json is present.`;
    if (env.DEV) {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }

  return config;
}

const resolvedConfig = resolveFirebaseConfig();

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);

export const db = resolvedConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, resolvedConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;

export async function testFirestoreConnectionOnce(): Promise<void> {
  if (connectionTested || typeof window === 'undefined') return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'settings', 'site'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
