import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, limit, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { errorService, ErrorType } from './lib/errorReporting';

import firebaseConfig from '@config/firebase-applet-config.json';

// Resolve Firebase configuration dynamically from environment, window, or local fallback JSON
const getResolvedFirebaseConfig = () => {
  // Helper to validate that a configuration object is a real production configuration (not empty)
  const isValidRealConfig = (cfg: any): boolean => {
    return !!(cfg && cfg.projectId);
  };

  // 1. Try secure runtime-injected configuration on window
  if (typeof window !== 'undefined' && (window as any).FIREBASE_CONFIG) {
    const wConfig = (window as any).FIREBASE_CONFIG;
    if (isValidRealConfig(wConfig)) {
      return wConfig;
    }
  }

  // 2. Try parsing individual environment variables from Vite or process.env (Vite define replacements)
  const envApiKey = import.meta.env?.VITE_FIREBASE_API_KEY || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY);
  const envAuthDomain = import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_AUTH_DOMAIN);
  const envProjectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_PROJECT_ID);
  const envStorageBucket = import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_STORAGE_BUCKET);
  const envMessagingSenderId = import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID);
  const envAppId = import.meta.env?.VITE_FIREBASE_APP_ID || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_APP_ID);
  const envFirestoreDatabaseId = import.meta.env?.VITE_FIRESTORE_DATABASE_ID || (typeof process !== 'undefined' && process.env?.VITE_FIRESTORE_DATABASE_ID);

  if (envProjectId) {
    return {
      apiKey: envApiKey || '',
      authDomain: envAuthDomain || '',
      projectId: envProjectId,
      storageBucket: envStorageBucket || '',
      messagingSenderId: envMessagingSenderId || '',
      appId: envAppId || '',
      firestoreDatabaseId: envFirestoreDatabaseId || '(default)'
    };
  }

  // 3. Try parsing a single environment JSON string if set
  const rawJson = import.meta.env?.VITE_FIREBASE_CONFIG || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_CONFIG);
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (isValidRealConfig(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('[Firebase] Failed to parse VITE_FIREBASE_CONFIG JSON:', e);
    }
  }

  // Default to the imported/compiled local JSON configuration
  return firebaseConfig;
};

const validConfig = getResolvedFirebaseConfig();

console.log('[Firebase] Initialized with Project:', validConfig.projectId, 'AuthDomain:', validConfig.authDomain);

const app = getApps().length === 0 ? initializeApp(validConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, validConfig.firestoreDatabaseId || '(default)'); /* CRITICAL: The app will break without this line */
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Re-export common functions to avoid direct firebase/* imports elsewhere
export { 
  onAuthStateChanged,
  onIdTokenChanged,
  collection, 
  getDocs, 
  query, 
  where, 
  limit,
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
