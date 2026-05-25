import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import firebaseConfig from '../firebase-applet-config.json';

const validConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || "mock-api-key-please-run-firebase-setup",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || "mock-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || "mock-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId || "1:1234567890:web:123456789",
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)';

if (!validConfig.projectId || validConfig.projectId === 'mock-project') {
  console.warn('⚠️ [Firebase] Running in unconfigured fallback/mock mode. Real-time features and authentication will require database provisioning via AI Studio setup.');
}

const app = getApps().length === 0 ? initializeApp(validConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId || '(default)');
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

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`Domain not authorized. Please go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add: ${window.location.hostname}`);
    } else {
        throw new Error(`Sign-in failed (${error.code || 'internal-error'}). Please check that Google Auth is ENABLED in your Firebase Console.`);
    }
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(`Firestore operation failed: ${errInfo.error} at ${path}`);
}
