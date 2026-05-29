import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, limit, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import firebaseConfig from './firebase-applet-config.json';

const validConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

if (!validConfig.projectId || validConfig.projectId === 'mock-project') {
  console.warn('⚠️ [Firebase] Running in unconfigured fallback/mock mode.');
} else {
  console.log('[Firebase] Initialized with Project:', validConfig.projectId, 'AuthDomain:', validConfig.authDomain);
}

const app = getApps().length === 0 ? initializeApp(validConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
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
      throw new Error('Sign-in was cancelled. Please try again when you are ready.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Your browser blocked the sign-in window. Please allow popups for this site and try again, or click the Open in New Tab icon (↗) at the top right.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network connection issues detected. Please check your internet connection and try again.');
    } else if (error.code === 'auth/unauthorized-domain') {
       throw new Error('This app is not yet authorized to use Google Sign-In. The developer needs to update the Firebase configuration.');
    } else {
      throw new Error('We could not securely sign you in at this time. Please try again later.');
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

async function testConnection() {
  if (!validConfig.projectId || validConfig.projectId === 'mock-project') return;
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
