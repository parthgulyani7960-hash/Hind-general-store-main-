import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged as fbOnAuthStateChanged, onIdTokenChanged as fbOnIdTokenChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, limit, doc, getDocFromServer, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { errorService, ErrorType } from './lib/incidentReporting';

import firebaseConfig from '@config/firebase-applet-config.json';

// Resolve Firebase configuration dynamically from environment, window, or local fallback JSON
const getResolvedFirebaseConfig = () => {
  const DEFAULT_DB_ID = 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
  
  // Baseline configuration for this applet
  const BASELINE = {
    projectId: "studio-8565200409-a3bd2",
    appId: "1:998402666181:web:a2e3847085e9ec08394aac",
    apiKey: "AIzaSyDQ6uuOgMOnj6BrJwW2PGv7R7CTN3AWE7w",
    authDomain: "studio-8565200409-a3bd2.firebaseapp.com",
    firestoreDatabaseId: DEFAULT_DB_ID,
    storageBucket: "studio-8565200409-a3bd2.firebasestorage.app",
    messagingSenderId: "998402666181"
  };

  // Helper to validate that a configuration object is a real production configuration (not empty)
  const isValidRealConfig = (cfg: any): boolean => {
    return !!(cfg && cfg.projectId && cfg.apiKey && 
              cfg.projectId !== 'undefined' && cfg.apiKey !== 'undefined' &&
              cfg.projectId.length > 5);
  };

  const merge = (base: any, incoming: any) => {
    const result = { ...base };
    if (!incoming) return result;
    Object.keys(incoming).forEach(key => {
      const val = incoming[key];
      if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== '""') {
        result[key] = val;
      }
    });
    return result;
  };

  // 1. Try secure runtime-injected configuration on window
  if (typeof window !== 'undefined' && (window as any).FIREBASE_CONFIG) {
    const wConfig = (window as any).FIREBASE_CONFIG;
    if (isValidRealConfig(wConfig)) {
      console.log('[Firebase] Using window.FIREBASE_CONFIG');
      return merge(BASELINE, wConfig);
    }
  }

const isBackend = typeof process !== 'undefined' && process.env != null;

  // 2. Try individual environment variables
  const getEnv = (key: string) => {
    if (isBackend) {
        return process.env[key] || process.env[key.replace('VITE_', '')];
    }
    const viteEnv = (import.meta as any).env;
    if (viteEnv) {
      return viteEnv[key];
    }
    return undefined;
  };

  const envConfig: any = {};
  const mapping: Record<string, string> = {
    VITE_FIREBASE_API_KEY: 'apiKey',
    VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
    VITE_FIREBASE_PROJECT_ID: 'projectId',
    VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
    VITE_FIREBASE_APP_ID: 'appId',
    VITE_FIRESTORE_DATABASE_ID: 'firestoreDatabaseId',
    VITE_FIREBASE_DATABASE_ID: 'firestoreDatabaseId'
  };

  let hasEnv = false;
  Object.entries(mapping).forEach(([envKey, configKey]) => {
    const val = getEnv(envKey);
    // Ignore 'undefined' explicitly stringified
    if (val && val !== 'undefined' && val !== '""') {
      // If we already have a value for firestoreDatabaseId, don't overwrite if the new one is empty or '(default)'
       if (configKey === 'firestoreDatabaseId' && envConfig[configKey] && (!val || val === '(default)' || val === 'null' || val === '')) {
         return;
       }
      envConfig[configKey] = val;
      hasEnv = true;
    }
  });

  // Explicitly ensure firestoreDatabaseId is set if found in env
  const directDbId = getEnv('VITE_FIREBASE_DATABASE_ID') || getEnv('VITE_FIRESTORE_DATABASE_ID');
  if (directDbId && directDbId !== 'undefined') {
    envConfig.firestoreDatabaseId = directDbId;
    hasEnv = true;
  }

  if (hasEnv && envConfig.projectId && envConfig.apiKey) {
    console.log('[Firebase] Using environment specific variables');
    const result = merge(BASELINE, envConfig);
    // Final safety: ensure it's not empty string or '(default)'
    if (!result.firestoreDatabaseId || result.firestoreDatabaseId === '(default)' || result.firestoreDatabaseId === 'null') {
       result.firestoreDatabaseId = DEFAULT_DB_ID;
    }
    return result;
  }

  // 3. Try local JSON if valid
  if (isValidRealConfig(firebaseConfig)) {
    console.log('[Firebase] Using local firebase-applet-config.json');
    return merge(BASELINE, firebaseConfig);
  }

  console.log('[Firebase] Using hardcoded baseline');
  return BASELINE;
};

const validConfig = getResolvedFirebaseConfig();

const activeDatabaseId = (validConfig.firestoreDatabaseId && validConfig.firestoreDatabaseId !== '(default)' && validConfig.firestoreDatabaseId !== 'null') 
  ? validConfig.firestoreDatabaseId 
  : 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';

const isDevMode = typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env?.DEV;

if (isDevMode) {
  console.log('--- FRONTEND FIREBASE DIAGNOSTICS ---');
  console.log('FRONTEND DATABASE ID:', activeDatabaseId);
  console.log('FIREBASE PROJECT ID:', validConfig.projectId);
  console.log('FIRESTORE DATABASE ID:', activeDatabaseId);
  console.log('------------------------------------');
}

let app: any;
let auth: any;
let db: any;
let storage: any;

try {
  app = getApps().length === 0 ? initializeApp(validConfig) : getApp();
} catch (appErr: any) {
  console.error('[Firebase] initializeApp failed:', appErr.message);
}

try {
  if (app) {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  } else {
    throw new Error('App not initialized');
  }
} catch (authErr: any) {
  console.error('[Firebase] getAuth failed, creating resilient client fallback:', authErr.message);
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      setTimeout(() => callback(null), 0);
      return () => {};
    },
    onIdTokenChanged: (callback: any) => {
      setTimeout(() => callback(null), 0);
      return () => {};
    }
  } as any;
}

if (auth && typeof auth.authStateReady !== 'function') {
  try {
    Object.defineProperty(auth, 'authStateReady', {
      value: () => Promise.resolve(),
      writable: true,
      configurable: true
    });
  } catch (e: any) {
    console.warn('[Firebase] Could not define authStateReady on auth instance safely:', e.message);
    try {
      (auth as any).authStateReady = () => Promise.resolve();
    } catch (innerErr: any) {
      console.warn('[Firebase] Direct assignment to authStateReady also failed:', innerErr.message);
    }
  }
}

try {
  if (app) {
    db = getFirestore(app, activeDatabaseId);
  } else {
    throw new Error('App not initialized');
  }
} catch (dbErr: any) {
  console.error('[Firebase] getFirestore failed, creating resilient client fallback:', dbErr.message);
  db = {} as any;
}

try {
  if (app) {
    storage = getStorage(app);
  } else {
    throw new Error('App not initialized');
  }
} catch (storageErr: any) {
  console.error('[Firebase] getStorage failed, creating resilient client fallback:', storageErr.message);
  storage = {} as any;
}

export { auth, db, storage };
export const googleProvider = new GoogleAuthProvider();

const onAuthStateChanged = (authInstance: any, next: any, error?: any, completed?: any) => {
  if (authInstance && typeof fbOnAuthStateChanged === 'function' && typeof authInstance.onAuthStateChanged !== 'function') {
    try {
      return fbOnAuthStateChanged(authInstance, next, error, completed);
    } catch (e: any) {
      console.error('[Firebase Wrapper] Error calling native onAuthStateChanged:', e.message);
    }
  }
  if (authInstance && typeof authInstance.onAuthStateChanged === 'function') {
    return authInstance.onAuthStateChanged(next, error, completed);
  }
  setTimeout(() => next(null), 0);
  return () => {};
};

const onIdTokenChanged = (authInstance: any, next: any, error?: any, completed?: any) => {
  if (authInstance && typeof fbOnIdTokenChanged === 'function' && typeof authInstance.onIdTokenChanged !== 'function') {
    try {
      return fbOnIdTokenChanged(authInstance, next, error, completed);
    } catch (e: any) {
      console.error('[Firebase Wrapper] Error calling native onIdTokenChanged:', e.message);
    }
  }
  if (authInstance && typeof authInstance.onIdTokenChanged === 'function') {
    return authInstance.onIdTokenChanged(next, error, completed);
  }
  setTimeout(() => next(null), 0);
  return () => {};
};

// Re-export common functions to avoid direct firebase/* imports elsewhere
export { 
  onAuthStateChanged,
  onIdTokenChanged,
  collection, 
  getDocs, 
  query, 
  where, 
  limit,
  orderBy,
  addDoc, 
  serverTimestamp,
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
};

const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again when you are ready.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Please allow popups for this site and try again, or click the Open in New Tab icon (↗) at the top right.';
    case 'auth/network-request-failed':
      return 'Network connection issues detected. Please check your internet connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This app is not yet authorized to use Google Sign-In. The developer needs to update the Firebase configuration.';
    default:
      return 'We could not securely sign you in at this time. Please try again later.';
  }
};

export const handleAuthError = (error: any): string => {
  if (error.name === 'ApiError' || error.name === 'RateLimitError') return error.message;
  if (error.status === 429) return "Access required due to rate limiting. Please try again after 10 minutes.";
  const errorCode = error?.code || error?.originalError?.code || '';
  return getFirebaseErrorMessage(errorCode) || error?.message || 'Authentication failed.';
};

export const signInWithGoogle = async (emailInput?: string) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (!result || !result.user) {
      throw new Error('Google Sign-In returned an empty result.');
    }
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const friendlyMessage = getFirebaseErrorMessage(errorCode);
    console.error('[Firebase] Standard Google Sign-In failed:', error);
    
    // Create an enriched robust error object with complete details
    const robustError = new Error(friendlyMessage);
    (robustError as any).code = errorCode;
    (robustError as any).originalError = error;
    
    throw robustError;
  }
};

export const signOutUser = async () => {
  return await signOut(auth);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  errorService.report({
    type: ErrorType.SYSTEM_ERROR,
    message: `Firestore operation failed: ${errInfo.error} at ${path || 'unknown path'}`,
    metadata: errInfo
  });
  throw new Error(`Firestore operation failed: ${errInfo.error} at ${path}`);
}

async function testConnection() {
  if (!validConfig.projectId) return;
  try {
    await getDocFromServer(doc(db, 'test_connection_ping', 'status'));
    console.log('[Firebase] Connection test succeeded.');
  } catch (error: any) {
    if (error?.message && (error.message.includes('the client is offline') || error.message.includes('unavailable') || error.code === 'unavailable')) {
      console.warn('[Firebase] Centralized connection test failed or client is offline:', error.message);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('firebase_unreachable', { detail: error.message }));
      }
    }
  }
}
// testConnection();
