import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged as fbOnAuthStateChanged, onIdTokenChanged as fbOnIdTokenChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, addDoc, serverTimestamp, limit, doc, getDocFromServer, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
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

const isAiStudioProject = validConfig.projectId === "studio-8565200409-a3bd2";

const activeDatabaseId = (validConfig.firestoreDatabaseId && validConfig.firestoreDatabaseId !== '(default)' && validConfig.firestoreDatabaseId !== 'null') 
  ? validConfig.firestoreDatabaseId 
  : (isAiStudioProject ? 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe' : undefined);

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
    db = activeDatabaseId ? getFirestore(app, activeDatabaseId) : getFirestore(app);
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
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

let resolveAuthReady: (value: any) => void;
export const authReadyPromise = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

if (auth && typeof fbOnIdTokenChanged === 'function') {
  let unsub: (() => void) | undefined;
  unsub = fbOnIdTokenChanged(auth, (user) => {
    resolveAuthReady(user);
    if (unsub) {
      unsub();
    } else {
      setTimeout(() => unsub?.(), 0);
    }
  }, (err) => {
    console.error('[Firebase] authReadyPromise check error:', err);
    resolveAuthReady(null);
    if (unsub) {
      unsub();
    } else {
      setTimeout(() => unsub?.(), 0);
    }
  });
} else {
  resolveAuthReady(null);
}

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
  doc,
  collection, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  limit,
  orderBy,
  onSnapshot,
  addDoc, 
  writeBatch,
  serverTimestamp,
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
};

const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled because the Google popup was closed. You can retry or use email sign-in below.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt was in progress. Please try again.';
    case 'auth/popup-blocked':
      return 'Popups were blocked by your browser. Please allow popups, open in a new tab, or use email sign-in below.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact customer support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please register or check your email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please check your password and try again.';
    case 'auth/invalid-email':
      return 'The email address provided is formatted incorrectly.';
    case 'auth/invalid-credential':
      return 'Invalid authentication credentials provided. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address under a different sign-in method.';
    case 'auth/credential-already-in-use':
      return 'These credentials are already associated with a different user account.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please check Firebase console configuration.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a moment before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection issue detected. Please check your internet connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This preview domain is not whitelisted in Google OAuth yet. You can sign in immediately using Email Sign-In below.';
    case 'auth/internal-error':
      return 'An internal authentication service notice occurred. Please retry sign-in.';
    default:
      return '';
  }
};

export const handleAuthError = (error: any): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  if (error.name === 'ApiError' || error.name === 'RateLimitError') return error.message;
  if (error.status === 429) return "Access required due to rate limiting. Please try again after 10 minutes.";
  
  const errorCode = error?.code || error?.originalError?.code || '';
  const mapped = getFirebaseErrorMessage(errorCode);
  if (mapped) return mapped;
  
  if (error?.message && typeof error.message === 'string' && error.message.trim().length > 0 && !error.message.includes('[object Object]')) {
    return error.message;
  }
  return 'Authentication could not be completed. Please try again.';
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const token = await result.user.getIdToken(true);
      return { user: result.user, token };
    }
    return null;
  } catch (error: any) {
    console.error('[Firebase] Error resolving redirect result:', error);
    throw error;
  }
};

export const signInWithGoogle = async (options?: { forceRedirect?: boolean }) => {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  try {
    if (options?.forceRedirect && !isInIframe) {
      console.log('[Firebase] Initiating Google Sign-In via redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    try {
      console.log('[Firebase] Initiating Google Sign-In via popup...');
      const result = await signInWithPopup(auth, googleProvider);
      if (!result || !result.user) {
        throw new Error('Google Sign-In returned an empty credential response.');
      }
      const token = await result.user.getIdToken(true);
      return { user: result.user, token };
    } catch (popupErr: any) {
      console.warn('[Firebase] signInWithPopup encountered:', popupErr?.code, popupErr?.message);
      
      if (popupErr?.code === 'auth/popup-closed-by-user') {
        const err = new Error('Sign-in cancelled: Google popup window was closed before completing.');
        (err as any).code = 'auth/popup-closed-by-user';
        throw err;
      }

      if (popupErr?.code === 'auth/cancelled-popup-request') {
        const err = new Error('A sign-in request is already in progress. Please wait a moment and try again.');
        (err as any).code = 'auth/cancelled-popup-request';
        throw err;
      }

      // If popup was blocked by browser and NOT in an iframe, fallback to redirect flow
      if (
        !isInIframe &&
        (popupErr?.code === 'auth/popup-blocked' ||
         popupErr?.message?.includes('Cross-Origin-Opener-Policy'))
      ) {
        console.log('[Firebase] Popup restricted in top-level window. Falling back to signInWithRedirect...');
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      if (isInIframe && popupErr?.code === 'auth/popup-blocked') {
        const err = new Error('Popups were blocked by your browser. Please allow popups for this site or open the app in a new tab.');
        (err as any).code = 'auth/popup-blocked';
        throw err;
      }

      throw popupErr;
    }
  } catch (error: any) {
    const errorCode = error?.code || '';
    const friendlyMessage = getFirebaseErrorMessage(errorCode) || error.message || 'Google Sign-In failed.';
    console.error('[Firebase] Google Sign-In error:', error);
    
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
