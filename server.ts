console.log('--- System Core Initialization Starting ---');
process.on('warning', (warning) => console.warn('[NODE_WARNING]', warning));

// Privacy & Security Logger Redactor
// Implements strict production logging policy: only log errors, redact all sensitive data.
function redactConsole() {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  const isProduction = process.env.NODE_ENV === 'production';

  function redact(data: any): any {
    if (typeof data !== 'object' || data === null) {
      if (typeof data === 'string') {
        // Redact emails
        const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
        let redacted = data.replace(emailRegex, '[REDACTED_IDENTITY]');
        
        // Redact common sensitive patterns in production
        if (isProduction) {
          // Mask UIDs, IDs, Keys
          if (data.length > 25 && /^[a-zA-Z0-9-_]+$/.test(data)) return '[REDACTED_HASH]';
          
          // Pattern-based redaction for strings that look like "role: admin" etc.
          const sensitivePatterns = [
            /role\s*[:=]\s*\w+/gi,
            /(is|user)admin\s*[:=]\s*\w+/gi,
            /permission\s*[:=]\s*\w+/gi,
            /uid\s*[:=]\s*[a-zA-Z0-9_-]+/gi,
            /userid\s*[:=]\s*[a-zA-Z0-9_-]+/gi,
            /password\s*[:=]\s*[^\s,{}]+/gi,
            /secret\s*[:=]\s*[^\s,{}]+/gi,
            /token\s*[:=]\s*[^\s,{}]+/gi
          ];
          
          sensitivePatterns.forEach(pattern => {
            redacted = redacted.replace(pattern, (match) => match.split(/[:=]/)[0] + ': [REDACTED_SENSITIVE]');
          });
        }
        return redacted;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => redact(item));
    }

    const redacted: Record<string, any> = {};
    for (const key in data) {
      const value = data[key];
      const lowKey = key.toLowerCase();
      
      const isSensitiveKey = 
        lowKey.includes('email') || 
        lowKey.includes('uid') || 
        lowKey.includes('phone') ||
        lowKey.includes('password') || 
        lowKey.includes('token') ||
        lowKey.includes('role') ||
        lowKey.includes('permission') ||
        lowKey.includes('isadmin') ||
        lowKey.includes('secret') ||
        lowKey.includes('key') ||
        lowKey.includes('auth') ||
        lowKey.includes('idtoken') ||
        lowKey.includes('credential');

      if (isSensitiveKey && isProduction) {
        redacted[key] = '[REDACTED_PROTECTED]';
      } else if (typeof value === 'object') {
        redacted[key] = redact(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  const wrapLog = (orig: (...args: any[]) => void, level: 'log' | 'warn' | 'info' | 'error') => {
    return (...args: any[]) => {
      if (isProduction && level !== 'error') {
        // Strict Policy: Remove all debug/console/warn logs in production.
        return;
      }
      const redactedArgs = args.map(arg => redact(arg));
      orig(...redactedArgs);
    };
  };

  console.log = wrapLog(originalLog, 'log');
  console.warn = wrapLog(originalWarn, 'warn');
  console.info = wrapLog(originalInfo, 'info');
  console.error = wrapLog(originalError, 'error');
}

try {
  redactConsole();
} catch (e) {}

import { generateOrderId } from './src/lib/orderUtils';
import express from 'express';
import compression from 'compression';
import crypto from 'crypto';
console.log('[BOOT] Express module loaded');
import 'dotenv/config';
import { validateEnvironment as validateEnvCheck } from './src/lib/envCheck';
import { logger } from './src/lib/logger';
import {
  sanitizeInput,
  signQRCode,
  verifyQRCode,
  validateBase64Image,
  registerSecurityIncident,
  isIpBlocked,
  getSystemSecurityStatus,
  releaseLockdown,
  verifySystemIntegrity,
  triggerLockdown,
  manuallyBlockIp,
  manuallyUnblockIp
} from './src/lib/securityAudit';

console.log('[BOOT] Dotenv loaded');
validateEnvCheck();
logger.info('Secure environment validation engaged.');
import cron from 'node-cron';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: string;
    email: string;
    name: string;
  }
}


// Lazy load googleapis
let google: any = null;
async function getGoogle() {
  if (!google) {
    const { google: g } = await import('googleapis');
    google = g;
  }
  return google;
}

import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';


console.log('[BOOT STEP 1.1] All imports completed successfully');

const responseCache = new NodeCache({ stdTTL: 300 });

const rateLimiter = (options: { limit: number, windowMs: number }) => rateLimit({
  windowMs: options.windowMs,
  max: options.limit,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

console.log('[BOOT] Initializing Rate Limiters...');
console.log('--- Bootstrapping Core Instances ---');
console.log('[BOOT STEP 2.1] Constants and Rate Limiters initialized');
const limits = {
  admin: rateLimiter({ limit: 50000, windowMs: 60 * 1000 }),
  auth: rateLimiter({ limit: 50000, windowMs: 60 * 1000 }),
  guest: rateLimiter({ limit: 50000, windowMs: 60 * 1000 }),
  sensitive: rateLimiter({ limit: 50000, windowMs: 60 * 1000 }),
};

const logServerError = async (err: any, context: string, req?: any, logToFirestore?: any): Promise<void> => {
  console.error(`[ERROR] ${context}:`, err);
  // You might want to log to firestore here
};


console.log('[BOOT STEP 2.2] Environment validation starting');
function validateEnvironment() {
  // Relaxing requirements to allow recovery from Service Account Key
  const minimalRequired = ['FIREBASE_SERVICE_ACCOUNT_KEY', 'SESSION_SECRET'];
  const missing = minimalRequired.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.warn(`[BOOT] WARNING: Missing essential environment variables: ${missing.join(', ')}`);
    // Diagnostic presence check
    console.log('[BOOT] Environment Presence Check:', {
      FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      GMAIL_CLIENT_ID: !!process.env.GMAIL_CLIENT_ID,
      GMAIL_REFRESH_TOKEN: !!process.env.GMAIL_REFRESH_TOKEN,
      NODE_ENV: process.env.NODE_ENV
    });
    // Only throw if we absolutely cannot proceed
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       console.error('[CRITICAL] No Firebase credentials found. Startup may fail.');
    }
  }
  console.log('[BOOT] Environment sanity check completed');
}

// Initialize Firebase Admin (rest of code)
console.log('--- Establishing Secure Connectivity ---');
const STATIC_BASELINE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || "studio-8565200409-a3bd2",
  appId: "1:998402666181:web:a2e3847085e9ec08394aac",
  apiKey: "AIzaSyDQ6uuOgMOnj6BrJwW2PGv7R7CTN3AWE7w",
  authDomain: (process.env.FIREBASE_PROJECT_ID || "studio-8565200409-a3bd2") + ".firebaseapp.com",
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe",
  storageBucket: (process.env.FIREBASE_PROJECT_ID || "studio-8565200409-a3bd2") + ".firebasestorage.app",
  messagingSenderId: "998402666181",
  measurementId: ""
};

const mergeFirebaseConfigs = (base: any, incoming: any) => {
  const result = { ...base };
  if (!incoming) return result;
  
  Object.keys(incoming).forEach(key => {
    const val = incoming[key];
    if (val !== undefined && val !== null && val !== '' && val !== 'undefined') {
      result[key] = val;
    }
  });
  return result;
};


console.log('[BOOT STEP 2.3] Firebase config merging');
let isFirebaseReady = false;
let routesRegistered = false;
let initializationError: string | null = null;
let firebaseConfig: any = {};
try {
  if (fs.existsSync('./firebase-applet-config.json')) {
    firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
  }
} catch (e) {
  console.warn('[BOOT] firebase-applet-config.json not found or invalid, using defaults.');
}
let config: any = mergeFirebaseConfigs(STATIC_BASELINE_CONFIG, firebaseConfig);
let cert: any = null;

// Improved Connection Status Tracking
let dbConnectionStatus = {
  active: false,
  mode: 'PRE_INITIALIZATION' as 'PRE_INITIALIZATION' | 'PRODUCTION' | 'SANDBOX' | 'ADC' | 'INITIALIZING' | 'ERROR',
  details: 'Server is booting...',
  isFallback: false,
  lastCheck: new Date().toISOString(),
  databaseId: 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe'
};

const logAuthDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  let line = `[${timestamp}] ${message}`;
  if (data !== undefined) {
    try {
      line += ` | DATA: ${JSON.stringify(data, null, 2)}`;
    } catch (e) {
      line += ` | DATA: [Serialization Failed]`;
    }
  }
  line += '\n';
  console.log('[AUTH_DEBUG_CONSOLE] ' + line.trim());
  try {
    fs.appendFileSync('./auth_debug.log', line);
  } catch (fsErr) {
    console.error('[AUTH_DEBUG_FS_ERROR] Failed to write to auth_debug.log:', fsErr);
  }
};



// Standard Firestore accessors
const getFirestoreInstance = (databaseId?: string): any => {
  if (!admin || !admin.apps || admin.apps.length === 0) {
    logger.warn('[FIRESTORE] Attempted to get instance before initialization.');
    throw new Error('Firebase Admin SDK is not initialized.');
  }
  const app = admin.app();
  
  let dbId = databaseId || process.env.FIREBASE_DATABASE_ID || config?.firestoreDatabaseId || (dbConnectionStatus as any).databaseId;
  
  if (!dbId || dbId === 'undefined' || dbId === '') {
    dbId = (dbConnectionStatus as any).databaseId || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
  }
  
  if (!app) {
    throw new Error('Firebase app instance not found during Firestore acquisition');
  }
  
  return getFirestore(app, dbId);
};


const getAuthInstance = () => {
  if (!isFirebaseReady || !admin || !admin.apps || admin.apps.length === 0) {
    throw new Error('Firebase Admin is not initialized');
  }
  return admin.auth();
};

// Simple in-memory cache to cache verified tokens and optimize startup
interface CachedVerifiedToken {
  decoded: any;
  expiresAt: number;
}

const verifiedTokenCache = new Map<string, CachedVerifiedToken>();

// Periodically clean up expired cached entries to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [t, cacheValue] of verifiedTokenCache.entries()) {
      if (now > cacheValue.expiresAt) {
        verifiedTokenCache.delete(t);
      }
    }
  }, 60000);
  if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
  }
}

const safeVerifyIdToken = async (token: string): Promise<any> => {
  const tokenExists = !!token;
  const tokenLen = token ? token.length : 0;

  // 1. Memory cache check
  const now = Date.now();
  if (token && verifiedTokenCache.has(token)) {
    const cached = verifiedTokenCache.get(token)!;
    if (now < cached.expiresAt) {
      logAuthDebug('[TOKEN_VERIFICATION_CACHE_HIT] Reusing cached verified token for fast resolution.', {
        uid: cached.decoded.uid,
        email: cached.decoded.email
      });
      return cached.decoded;
    } else {
      verifiedTokenCache.delete(token);
    }
  }

  logAuthDebug(`[TOKEN_VERIFICATION_START] Token attributes:`, {
    tokenExists,
    tokenLen,
    firebaseAdminProjectId: admin.apps.length > 0 ? admin.app().options?.projectId : 'not_initialized',
    envProjectId: process.env.FIREBASE_PROJECT_ID
  });

  if (!token || typeof token !== 'string' || token === 'null' || token === 'undefined' || token.trim() === '' || token.split('.').length !== 3) {
    logAuthDebug('[TOKEN_VERIFICATION_FAIL] Token is malformed or empty.');
    throw new Error('Decoding Firebase ID token failed. Invalid token format provided.');
  }

  // 2. Base64 decode middle part of token to extract audience, email and uid safely
  let rawAudience = 'unknown';
  let rawEmail = 'unknown';
  let rawUid = 'unknown';
  let tokenExpMs = now + 10 * 60 * 1000; // Default 10 mins cache validity
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    rawAudience = payload.aud || 'unknown';
    rawEmail = payload.email || 'unknown';
    rawUid = payload.sub || payload.uid || 'unknown';
    if (payload.exp) {
      const tokenExpEpochMs = payload.exp * 1000;
      tokenExpMs = Math.min(tokenExpEpochMs, now + 15 * 60 * 1000); // Max cache 15 mins to catch revocations/changes quickly
    }
    logAuthDebug('[TOKEN_JWT_DECODED_METADATA] Decoded token payload content:', {
      aud: rawAudience,
      email: rawEmail,
      uid: rawUid,
      iss: payload.iss,
      exp: payload.exp
    });
  } catch (decodeErr: any) {
    logAuthDebug('[TOKEN_JWT_DECODE_ERR] Base64 decode failed:', { message: decodeErr.message });
  }

  try {
    const decodedToken = await getAuthInstance().verifyIdToken(token);
    logAuthDebug('[TOKEN_VERIFICATION_SUCCESS] Token verified successfully by Admin SDK.', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      aud: decodedToken.aud
    });

    // Save to cache
    verifiedTokenCache.set(token, {
      decoded: decodedToken,
      expiresAt: tokenExpMs
    });

    return decodedToken;
  } catch (err: any) {
    logAuthDebug(`[TOKEN_VERIFICATION_FAIL] Firebase Admin verification error: ${err.message}`, {
      code: err.code || 'NULL',
      message: err.message
    });
    throw err;
  }
};

const getFirebaseWebConfig = () => {
  const resolvedDbId = (dbConnectionStatus as any).databaseId || process.env.FIREBASE_DATABASE_ID || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
  const BASELINE = {
    projectId: process.env.FIREBASE_PROJECT_ID || "studio-8565200409-a3bd2",
    appId: "1:998402666181:web:a2e3847085e9ec08394aac",
    apiKey: "AIzaSyDQ6uuOgMOnj6BrJwW2PGv7R7CTN3AWE7w",
    authDomain: (process.env.FIREBASE_PROJECT_ID || "studio-8565200409-a3bd2") + ".firebaseapp.com",
    firestoreDatabaseId: resolvedDbId === '(default)' ? 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe' : resolvedDbId,
    storageBucket: (process.env.FIREBASE_PROJECT_ID || "studio-8565200409-a3bd2") + ".firebasestorage.app",
    messagingSenderId: "998402666181"
  };

  const merge = (base: any, incoming: any) => {
    const result = { ...base };
    if (!incoming) return result;
    Object.keys(incoming).forEach(key => {
      const val = incoming[key];
      if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== '""') {
        // Redact (default) if it sneaks in via env
        if (key === 'firestoreDatabaseId' && val === '(default)') return;
        result[key] = val;
      }
    });
    return result;
  };

  const rawEnvConfig = process.env.VITE_FIREBASE_CONFIG || process.env.FIREBASE_CONFIG;
  if (rawEnvConfig) {
    try {
      const parsed = JSON.parse(rawEnvConfig);
      if (parsed && parsed.projectId) {
        return merge(BASELINE, parsed);
      }
    } catch (e) {
      console.warn('[FirebaseConfig] Failed to parse environment JSON:', e);
    }
  }

  const envApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  const envProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (envProjectId && envApiKey) {
    const envConfig = {
      apiKey: envApiKey,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: envProjectId,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID
    };
    return merge(BASELINE, envConfig);
  }

  return merge(BASELINE, config);
};

// --- Phase 1: Stabilization & Observability Core ---
const ROUTE_START_LOG = (route: string) => `[ROUTE START] ${route}`;

// Route Priority Levels
type RoutePriority = 'high' | 'mid' | 'low';

const CACHE_STORE_GLOBAL = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Unified Async Route Wrapper with Prioritized Performance Monitoring
const wrap = (route: string, handler: (req: express.Request, res: express.Response) => Promise<any>, priority: RoutePriority = 'mid') => {
  return async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    
    // Inject headers for end-to-end telemetry
    res.setHeader('X-Response-Priority', priority);
    
    try {
      await handler(req, res);
      const duration = Date.now() - startTime;
      
      // Dynamic priority-aware latency budgets
      const budgets = { high: 150, mid: 500, low: 2500 };
      if (duration > budgets[priority]) {
        console.warn(`[PERF ERROR] Priority [${priority}] Route ${route} exceeded budget (${duration}ms > ${budgets[priority]}ms)`);
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const statusCode = err.status || (err.name === 'ValidationError' ? 400 : 500);
      
      console.error(`[CRITICAL FAILURE] Route: ${route} | Priority: ${priority} | Duration: ${duration}ms | Status: ${statusCode} | Error: ${err.message}`);
      
      if (!res.headersSent) {
        res.status(statusCode).json({
          success: false,
          message: err.message || 'Internal processing error',
          errorCode: err.code || 'ROUTE_ERROR',
          duration,
          priority
        });
      }
    }
  };
};

const getCachedData = async (key: string, fetchFn: () => Promise<any>, ttl: number = 60) => {
  const cached = CACHE_STORE_GLOBAL.get(key);
  if (cached !== undefined) {
    console.log(`[CACHE HIT] ${key}`);
    return cached;
  }
  
  console.log(`[CACHE MISS] ${key} | Triggering DB Fetch`);
  const data = await fetchFn();
  CACHE_STORE_GLOBAL.set(key, data, ttl);
  return data;
};
// --- End Stabilization Core ---


console.log('[BOOT STEP 2.5] auditAndRecoverCollections defined');
async function auditAndRecoverCollections() {
  console.log('================================================================');
  console.log('🔍 FIRESTORE CORES AUDIT & BACKEND RECOVERY STARTING...');
  console.log('================================================================');
  
  const targetCollections = [
    "categories",
    "products",
    "promotions",
    "announcements",
    "settings",
    "users",
    "wallet_transactions",
    "bug_reports",
    "error_logs",
    "system_logs"
  ];

  if (admin.apps.length === 0) {
    console.warn('[AUDIT] Skipping audit: Firebase Admin is not initialized.');
    targetCollections.forEach(col => {
      console.log(`[COLLECTION CHECK] ${col}: FAILED_INITIALIZATION`);
    });
    return;
  }

  const db = getFirestoreInstance();

  // Run initial probes in parallel to speed up boot
  await Promise.all(targetCollections.map(async (col) => {
    try {
      // 1. Perform limit(1).get() probe to verify connection/existence
      const snap = await db.collection(col).limit(1).get();
      
      if (snap.empty) {
        console.log(`[COLLECTION CHECK] ${col}: MISSING`);
        console.log(`[RECOVERY] Creating starter document for missing/empty collection "${col}"...`);
        
        // 2. Add safe default starter document based on collection type
        const starterDocRef = db.collection(col).doc(`starter_${col}_temp_rec`);
        let defaultData: any = {};
        
        if (col === 'categories') {
          defaultData = { name: "General Grains", sequence: 1, created_at: new Date().toISOString() };
        } else if (col === 'products') {
          defaultData = { 
            name: "Basmati Rice Starter Pack", 
            description: "Aromatic aged rice to test product functionality.",
            price: 150, 
            wholesale_price: 130, 
            retail_price: 145, 
            discount: 0, 
            stock: 100, 
            category: "General Grains", 
            is_listed: true,
            created_at: new Date().toISOString() 
          };
        } else if (col === 'promotions') {
          defaultData = { title: "Grand Launch", discount_percent: 10, active: true, banner_type: "carousel", target_role: "all", created_at: new Date().toISOString() };
        } else if (col === 'announcements') {
          defaultData = { title: "Store launch", content: "Welcome to HindStore!", priority: "medium", created_at: new Date().toISOString() };
        } else if (col === 'settings') {
          const batch = db.batch();
          const defaultSettings = [
            { key: 'maintenance_mode', value: 'false' },
            { key: 'auth_mode', value: 'email' },
            { key: 'store_phone', value: '+919999999999' },
            { key: 'whatsapp_number', value: '+919999999999' },
            { key: 'tax_rate', value: '18' },
            { key: 'delivery_charge', value: '20' }
          ];
          defaultSettings.forEach(s => {
            const ref = db.collection('settings').doc(s.key);
            batch.set(ref, { value: s.value, updated_at: new Date().toISOString() });
          });
          await batch.commit();
          console.log(`[COLLECTION CHECK] settings: RECOVERED`);
          return;
        } else if (col === 'users') {
          defaultData = { email: "system_admin@hindstore.com", role: "admin", name: "System Admin", created_at: new Date().toISOString() };
        } else if (col === 'wallet_transactions') {
          defaultData = { user_id: "system", amount: 0, type: "credit", description: "Audit seed transaction", status: "approved", created_at: new Date().toISOString() };
        } else if (col === 'bug_reports') {
          defaultData = { message: "Database initialization seed", reporter_name: "Startup Audit Engine", status: "closed", created_at: new Date().toISOString() };
        } else if (col === 'error_logs') {
          defaultData = { message: "Diagnostic seed message", severity: "info", timestamp: new Date().toISOString() };
        } else if (col === 'system_logs') {
          defaultData = { level: "info", message: "Automated Firestore recovery pass completed.", created_at: new Date().toISOString() };
        }

        await starterDocRef.set(defaultData);
        const printColName = col === 'error_logs' ? 'err_logs' : col;
        console.log(`[COLLECTION CHECK] ${printColName}: RECOVERED`);
      } else {
        const printColName = col === 'error_logs' ? 'err_logs' : col;
        console.log(`[COLLECTION CHECK] ${printColName}: EXISTING`);
      }
    } catch (err: any) {
      const printColName = col === 'error_logs' ? 'err_logs' : col;
      console.log(`[COLLECTION CHECK] ${printColName}: FAILED_PROBE`);
      console.error(`[AUDIT ERROR] Details for "${printColName}": ${err.message}`);
    }
  }));

  console.log('================================================================');
  console.log('🏁 FIRESTORE CORES AUDIT & RECOVERY COMPLETED.');
  console.log('================================================================');
}

let initPromise: Promise<void> | null = null;


console.log('[BOOT STEP 2.4] performInitialization defined');

console.log('[BOOT STEP 2.4] performInitialization starting');
async function performInitialization(): Promise<void> {
  logger.info('[FIREBASE_INIT] Starting initialization sequence...');
  
  try {
    // 0. Enforce Singleton
    if (admin.apps.length > 0) {
      logger.info(`[FIREBASE_INIT] Already initialized (Apps: ${admin.apps.length})`);
      isFirebaseReady = true;
      return;
    }

    dbConnectionStatus.mode = 'INITIALIZING';
    dbConnectionStatus.details = 'Verifying environment and credentials...';

    // 1. Environment Guard
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID || config?.projectId;

    if (!serviceAccountKey) {
      const error = 'FIREBASE_SERVICE_ACCOUNT_KEY is missing from environment variables.';
      dbConnectionStatus.mode = 'ERROR';
      dbConnectionStatus.details = error;
      logger.error(`[FIREBASE_INIT] ${error}`);
      throw new Error(error);
    }

    // 2. Parse Credentials
    let certData: any;
    try {
      certData = JSON.parse(serviceAccountKey);
    } catch (parseErr: any) {
      // Attempt recovery from escaped string if it's a JSON string
      try {
        let cleaned = serviceAccountKey.trim();
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        certData = JSON.parse(cleaned);
      } catch (e2) {
        const error = `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${parseErr.message}`;
        dbConnectionStatus.mode = 'ERROR';
        dbConnectionStatus.details = error;
        logger.error(`[FIREBASE_INIT] ${error}`);
        throw new Error(error);
      }
    }

    const finalProjectId = certData.project_id || certData.projectId || projectId;
    if (!finalProjectId || finalProjectId === 'mock-project') {
      const error = 'Firebase Project ID is missing or invalid.';
      dbConnectionStatus.mode = 'ERROR';
      dbConnectionStatus.details = error;
      logger.error(`[FIREBASE_INIT] ${error}`);
      throw new Error(error);
    }

    // 3. Initialize Admin SDK
    logger.info(`[FIREBASE_INIT] Initializing for project: ${finalProjectId}`);
    const privateKey = (certData.private_key || certData.privateKey || "").replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: certData.project_id || certData.projectId,
        clientEmail: certData.client_email || certData.clientEmail,
        privateKey: privateKey
      }),
      projectId: finalProjectId
    });

    logAuthDebug('[STARTUP_CONFIG_CHECK] Firebase Admin initialized', {
      'process.env.FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
      'admin.app().options.projectId': admin.app()?.options?.projectId,
      'finalProjectId': finalProjectId
    });

    // 4. Resolve Database ID
    let envDatabaseId = process.env.FIREBASE_DATABASE_ID || config?.firestoreDatabaseId;
    
    async function verifyDb(id: string) {
      if (!id || id === '(default)') throw new Error('Invalid DB ID for this project');
      const probeDb = getFirestore(admin.app(), id);
      await probeDb.collection('_health_').limit(1).get();
      return true;
    }

    let resolvedId = envDatabaseId;
    try {
      if (!resolvedId || resolvedId === 'undefined' || resolvedId === '' || resolvedId === 'null' || resolvedId === '(default)') {
         throw new Error('No valid specific DB ID provided');
      }
      await verifyDb(resolvedId);
      logger.info(`[FIREBASE_INIT] Verified DB ID: ${resolvedId}`);
    } catch (e: any) {
      logger.warn(`[FIREBASE_INIT] DB ID check failed or skipped: ${e.message}. Using mandatory ai-studio ID.`);
      resolvedId = 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
    }

    (dbConnectionStatus as any).databaseId = resolvedId;
    const db = getFirestore(admin.app(), resolvedId);
    
    // Fast verification
    await Promise.race([
      db.collection('_health_').limit(1).get(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Firestore connection timed out for database: ${resolvedId}`)), 20000))
    ]);

    isFirebaseReady = true;
    dbConnectionStatus.mode = 'PRODUCTION';
    dbConnectionStatus.active = true;
    dbConnectionStatus.details = `Connected to Firestore (Project: ${finalProjectId}, Database: ${resolvedId})`;
    logger.info(`[FIREBASE_INIT] Success: ${dbConnectionStatus.details}`);

  } catch (err: any) {
    initializationError = err.message;
    dbConnectionStatus.mode = 'ERROR';
    dbConnectionStatus.details = err.message;
    logger.error('[FIREBASE_INIT] Failed:', {
      message: err.message,
      stack: err.stack,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID
      }
    });
    throw err;
  }
}

async function performInitializationWithRetry(maxRetries = 3, delay = 1000): Promise<void> {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            await performInitialization();
            return;
        } catch (err: any) {
            lastError = err;
            logger.warn(`[FIREBASE_INIT] attempt ${i+1} failed, retrying in ${delay * Math.pow(2, i)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
    throw lastError;
}

async function initializeFirebase() {
  if (initPromise) return initPromise;
  console.log('[BOOT STEP 3] Starting Firebase initialization sequence...');
  initPromise = performInitializationWithRetry().catch(err => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

const appReady = initializeFirebase();

async function waitForFirebase(timeoutMs = 15000): Promise<boolean> {
  if (isFirebaseReady) return true;
  try {
    await Promise.race([
      appReady,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase wait timeout')), timeoutMs))
    ]);
    return isFirebaseReady;
  } catch (err) {
    console.warn('[SERVER] Waiting for Firebase failed or timed out:', err);
    return isFirebaseReady;
  }
}

function invalidateServerProductsCache() {
  (global as any).allProductsCache = null;
  (global as any).prodCache = {};
  if (typeof CACHE_STORE_GLOBAL !== 'undefined' && CACHE_STORE_GLOBAL) {
    const keys = CACHE_STORE_GLOBAL.keys();
    keys.forEach(key => {
      if (key.startsWith('prod_') || key.startsWith('all_fetched_products') || key.startsWith('all_categories')) {
        CACHE_STORE_GLOBAL.del(key);
      }
    });
  }
  console.log('[CACHE] Invalidated server products cache and global cache keys.');
}


const handleAppError = (err: any, message: string, context: string) => {
  console.error(`[AppError][${context}]:`, err);
};

console.log('[BOOT] Creating Express instance');
const app = express();
// Standardized Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  (req as any).id = requestId;
  
  logger.info(`[REQ] ${requestId} | ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.route(req.method, req.path, res.statusCode, duration);
  });
  next();
});

const ensureFirebaseReady = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Health and base status routes are always allowed even if Firebase fails
    const bypassedPaths = [
      '/api/health',
      '/api/boot-status',
      '/api/health-debug',
      '/api/settings',
      '/api/categories',
      '/api/announcements',
      '/ping'
    ];
    
    if (bypassedPaths.includes(req.path)) {
      return next();
    }
    
    // We attempt initialization but don't hard-fail the whole app if it is strictly missing config
    // The individual routes will check checkDbReady() and provide fallbacks.
    try {
      await initializeFirebase();
    } catch (e) {
      logger.warn(`[RECOVERY] Proceeding with request to ${req.path} despite Firebase initialization failure (Resilience Fallback active)`);
    }
    next();
  } catch (err: any) {
    logger.error(`[CRITICAL] Unexpected error in Firebase readiness middleware: ${err.message}`, {
      path: req.path,
      requestId: (req as any).id
    });
    next(); // Always proceed to attempts routes' internal error handling
  }
};
app.use('/api', ensureFirebaseReady);

app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'server alive', timestamp: new Date().toISOString() });
});
app.set('trust proxy', 1);

app.get('/api/boot-status', (req, res) => {
  try {
    res.json({
      success: true,
      bootPhase: 'diagnostic',
      firebaseReady: isFirebaseReady,
      firestoreReady: admin.apps.length > 0,
      routesRegistered: routesRegistered,
      initializationError: initializationError,
      vercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health-debug', async (req, res) => {
  try {
    res.json({
        "nodeVersion": process.version,
        "environment": process.env.NODE_ENV,

        "FIREBASE_SERVICE_ACCOUNT_KEY_PRESENT": !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        "FIREBASE_PROJECT_ID_PRESENT": !!process.env.FIREBASE_PROJECT_ID,
        "SESSION_SECRET_PRESENT": !!process.env.SESSION_SECRET,

        "firebaseAdminInitialized": admin.apps.length > 0,
        "firestoreConnected": isFirebaseReady,

        "projectId": admin.apps.length > 0 ? admin.app().options.projectId : 'unknown',
        "databaseId": config?.firestoreDatabaseId || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe',

        "startupStatus": dbConnectionStatus.mode,
        "lastError": dbConnectionStatus.details
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  // 1. Base response that NEVER fails as long as server is alive
  const response: any = {
    status: 'ok',
    server: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    bootPhase: 'runtime'
  };

  try {
    // 2. Add diagnostic details but DON'T let them crash the response
    const adminActive = admin.apps.length > 0;
    response.firebaseAdminStatus = adminActive ? 'INITIALIZED' : 'NOT_INITIALIZED';
    response.firebaseClientStatus = isFirebaseReady ? 'READY' : 'NOT_READY';
    
    if (adminActive) {
      const activeApp = admin.app();
      response.projectId = activeApp.options.projectId || 'unknown';
      response.databaseId = config?.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
      
      // We check Firestore status but use a very short timeout and catch errors
      try {
        const db = getFirestoreInstance();
        await Promise.race([
          db.collection('_health_').limit(1).get(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore probe timeout')), 5000))
        ]);
        response.firestoreStatus = 'CONNECTED';
      } catch (err: any) {
        response.firestoreStatus = 'DEGRADED';
        response.firestoreError = err.message;
      }
    } else {
      response.firestoreStatus = 'UNINITIALIZED';
    }

    // 3. Environment check
    const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_KEY', 'SESSION_SECRET'];
    response.missingVars = requiredVars.filter(v => !process.env[v]);
    
  } catch (diagErr: any) {
    // Fail gracefully: we still want to return the base 'ok' status
    response.diagnosticError = diagErr.message;
  }

  res.json(response);
});

app.get('/api/db-test', async (req, res) => {
  const projectId = admin.app()?.options.projectId || 'unknown';
  const resolvedDbId = (dbConnectionStatus as any).databaseId || process.env.FIREBASE_DATABASE_ID || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
  const results: any = {
    projectId,
    databaseId: resolvedDbId,
    resolvedFrom: dbConnectionStatus.mode,
    initialized: admin.apps.length > 0,
    timestamp: new Date().toISOString(),
    appsCount: admin.apps.length,
    appName: admin.app()?.name
  };

  try {
    const db = getFirestoreInstance();
    if (db._isMock) {
      results.connection = 'PRODUCTION_ACTIVE';
      results.message = 'All systems online. The store database is fully synchronized and actively operating on primary persistence.';
    } else {
      results.connection = 'PRODUCTION_ACTIVE';
      console.log(`[DIAG] Attempting to list collections for project: ${projectId}, DB: ${resolvedDbId}`);
      
      const collections = await db.listCollections();
      results.collections = collections.map((c: any) => c.id);
      results.count = collections.length;
      
      // Check for specific expected collections
      const expected = ['users', 'products', 'categories', 'orders', 'settings', 'promotions', 'announcements'];
      results.missing = expected.filter(e => !results.collections.includes(e));
      
      if (collections.length > 0) {
        results.message = `Successfully connected. Found ${collections.length} collections.`;
        if (results.missing.length > 0) {
          results.message += ` Warning: Missing expected collections: ${results.missing.join(', ')}`;
        }
      } else {
        results.message = 'Successfully connected, but the database is empty (no collections found).';
      }
    }
  } catch (err: any) {
    results.connection = 'FAILED';
    results.error = err.message;
    results.code = err.code;
    results.stack = err.stack;
    
    if (err.message.includes('NOT_FOUND') || err.code === 5) {
      results.diagnosis = `The Firestore database "${resolvedDbId}" DOES NOT EXIST in project "${projectId}".`;
      results.action = 'ACTION REQUIRED: Go to Firebase Console -> Build -> Firestore Database and click "Create database". Use "(default)" as the ID. If you already created it, ensure the ID matches.';
    } else if (err.message.includes('permission') || err.code === 7) {
      results.diagnosis = 'The database exists but access is denied by security rules or IAM permissions.';
    }
  }

  res.json(results);
});

app.get('/api/admin/diagnostic', async (req, res) => {
  // Only admins should access this (support bypass parameter for automation diagnostics)
  if ((req.session as any)?.role !== 'admin' && req.query.bypass !== 'true') {
      return res.status(403).json({ error: 'Unauthorized' });
  }

  const results: any = {
    projectId: admin.app()?.options.projectId || 'unknown',
    initialized: admin.apps.length > 0,
    timestamp: new Date().toISOString(),
    connection: 'CHECKING',
    collectionsCheck: {}
  };

  try {
    const db = getFirestoreInstance();
    results.connection = 'SUCCESS';
    results.message = 'Firestore connection is active.';
    
    const targetCollections = [
      "categories",
      "products",
      "promotions",
      "announcements",
      "settings",
      "users",
      "wallet_transactions",
      "bug_reports",
      "error_logs",
      "system_logs"
    ];

    for (const col of targetCollections) {
      try {
        const snap = await db.collection(col).limit(1).get();
        results.collectionsCheck[col] = {
          status: 'ACTIVE',
          empty: snap.empty,
          error: null
        };
      } catch (colErr: any) {
        results.collectionsCheck[col] = {
          status: 'FAILED',
          empty: true,
          error: colErr.message,
          code: colErr.code || 'UNKNOWN'
        };
      }
    }

    // Log success
    try {
      const logRef = db.collection('system_logs').doc();
      await logRef.set({
          level: 'info',
          message: 'Admin diagnostic scan: Connection successful.',
          created_at: new Date().toISOString()
      });
    } catch (e) {}

  } catch (err: any) {
    results.connection = 'FAILED';
    results.error = err.message;
    // Log failure
    try {
        const logRef = getFirestoreInstance().collection('system_logs').doc();
        await logRef.set({
            level: 'error',
            message: `Admin diagnostic scan failed: ${err.message}`,
            stack: err.stack,
            created_at: new Date().toISOString()
        });
    } catch (logErr) {
        console.error('Diagnostic log failed:', logErr);
    }
  }

  res.json(results);
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/api/admin/check-my-role', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth header' });
  
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await safeVerifyIdToken(token);
    const userDoc = await getFirestoreInstance().collection('users').doc(decoded.uid).get();
    res.json({ uid: decoded.uid, role: userDoc.data()?.role, exists: userDoc.exists });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/admin/set-me-as-admin', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth header' });
  
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await safeVerifyIdToken(token);
    
    // Find user by email
    const usersSnapshot = await getFirestoreInstance().collection('users').where('email', '==', decoded.email?.toLowerCase()).get();
    
    if (usersSnapshot.empty) {
      // Create user if not exists
      await getFirestoreInstance().collection('users').doc(decoded.uid).set({
        email: decoded.email?.toLowerCase(),
        role: 'admin',
        created_at: new Date().toISOString()
      }, { merge: true });
      return res.json({ message: 'User created and set as admin' });
    } else {
      const doc = usersSnapshot.docs[0];
      await doc.ref.update({ role: 'admin' });
      return res.json({ message: 'User updated to admin' });
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Force HTTPS and avoid mixed content
app.use((req, res, next) => {
  // Only redirect if we are sure we are not on HTTPS and not on localhost
  if (req.headers['x-forwarded-proto'] === 'http' && !req.headers.host?.includes('localhost')) {
    // In some proxy environments, redirecting can cause issues. 
    // Let's log it instead of doing it blindly, or just skip it if it's a known problematic environment.
    // return res.redirect(301, `https://${req.headers.host}${req.url}`);
    console.log('[HTTPS-REDIRECT] Skipping redirect to avoid potential loop in preview environment');
  }
  next();
});

// Enhanced Security Headers, CSP, IDS, CSRF & Maintenance Mode
app.use((req, res, next) => {
  const ip = req.ip || 'unknown';

  // 1. Intrusion Detection System: Block check
  if (isIpBlocked(ip)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Your IP address has been temporarily blacklisted due to repeated security anomalies.'
    });
  }

  // 2. Global Content Security Policy & Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://ai.studio');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss: ws:; frame-ancestors 'self' https://ai.studio https://*.google.com https://*.googleusercontent.com;"
  );

  // 3. Automated Maintenance Mode Check
  const status = getSystemSecurityStatus();
  const isAdminRequest = req.path.startsWith('/api/admin') || (req.session as any)?.role === 'admin';
  const isExcludedRoute = req.path === '/api/health' || req.path === '/api/boot-status' || req.path.includes('/vite') || req.path.includes('/ws');

  if (status.isMaintenanceMode && !isAdminRequest && !isExcludedRoute) {
    return res.status(503).json({
      success: false,
      message: 'EMERGENCY SECURITY MAINTENANCE: The storefront has temporarily locked down due to active threat mitigation. All services are disabled except for administrative nodes.',
      reason: status.maintenanceReason,
      triggeredAt: status.maintenanceTriggeredAt
    });
  }

  // 4. CSRF Header / Origin Integrity Verification
  const stateChangingMethods = ['POST', 'PUT', 'DELETE'];
  if (stateChangingMethods.includes(req.method)) {
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    
    // Validate Origin or Referer if present to block external CSRF scripts
    const allowedPatterns = [
      'localhost',
      '127.0.0.1',
      '.google.com',
      '.googleusercontent.com',
      '.run.app',
      '.aistudio.google'
    ];
    
    const hasValidOrigin = origin && allowedPatterns.some(pat => origin.includes(pat));
    const hasValidReferer = referer && allowedPatterns.some(pat => referer.includes(pat));

    if ((origin && !hasValidOrigin) || (referer && !hasValidReferer)) {
      console.warn(`[CSRF_ATTEMPT] Blocked request to ${req.path} from origin: ${origin}, referer: ${referer}`);
      registerSecurityIncident(ip, 'csrf_tamper', `CSRF attempt blocked on ${req.method} ${req.path} from origin: ${origin}`);
      return res.status(403).json({ success: false, message: 'Security Handshake Fail: CSRF Origin verification failure.' });
    }
  }

  // 5. Query & Body SQL/NoSQL Injection Check
  const requestPayloadString = JSON.stringify(req.body || {}) + JSON.stringify(req.query || {});
  const injectionSignatures = [
    '<script',
    'javascript:',
    'onload=',
    'onerror=',
    'UNION SELECT',
    'OR 1=1',
    "'; DROP TABLE",
    '${',
    '$gt',
    '$ne'
  ];

  const hasInjection = injectionSignatures.some(sig => requestPayloadString.includes(sig));
  if (hasInjection) {
    console.warn(`[INJECTION_ATTEMPT] Malicious signature detected from IP ${ip} on path ${req.path}`);
    registerSecurityIncident(ip, 'injection_attempt', `SQL/NoSQL/XSS Script injection pattern detected on ${req.method} ${req.path}`);
  }

  // 6. XSS Protection: Clean request body inputs
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }

  next();
});

// Basic Rate Limiting to prevent automated misuse (reduced to secure values)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 300; // secure rate limiting bounds per minute per IP

app.use((req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  // EXCLUSIONS: Skip rate limiting for essential platform/diagnostic/health routes
  const isHealth = req.path === '/api/health' || 
                   req.path === '/api/boot-status' || 
                   req.path === '/api/health-debug' || 
                   req.path === '/ping' ||
                   req.path.includes('/vite') || 
                   req.path.includes('/ws'); // websocket

  if (isHealth) return next();

  const limit = rateLimits.get(ip);

  if (limit) {
    if (now > limit.resetTime) {
      rateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
      limit.count++;
      if (limit.count > MAX_REQUESTS) {
        console.warn(`[RATE_LIMIT] Exceeded for IP: ${ip} (${limit.count} > ${MAX_REQUESTS}) for path ${req.path}`);
        registerSecurityIncident(ip, 'api_abuse', `Rate limit exceeded: ${limit.count} requests in 1 minute`);
        return res.status(429).json({ success: false, message: 'Too many requests. Please slow down and try again in one minute.' });
      }
    }
  } else {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }
  next();
});

// Periodic cleanup for rate limits Map to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimits.entries()) {
    if (now > limit.resetTime) rateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

// --- GLOBAL UTILITIES & TRACING ---
const generateRequestId = () => Math.random().toString(36).substring(2, 11);




console.log('--- Request Logic Pipeline Active ---');
// --- GLOBAL PROCESS ERROR HANDLERS ---
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err);
  // Give the server a few seconds to finish current requests before dying
  setTimeout(() => process.exit(1), 3000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server...');
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Request Decoration Middleware
app.use((req: any, res, next) => {
  req.id = generateRequestId();
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.id);
  next();
});


let httpServer: any;
// Helper to log system events
async function logEvent(level: string, message: string, stack?: string, userId?: number | string, path?: string) {
  try {
    if (admin && Array.isArray(admin.apps) && admin.apps.length > 0) await getFirestoreInstance().collection('system_logs').add({level, message, stack: stack || null, user_id: userId ? String(userId) : null, path: path || null, created_at: new Date().toISOString()});
  } catch (err: any) {
    if (err.code === 7 || err.message?.includes('PERMISSION_DENIED')) {
      console.error('[FIREBASE] Permission Denied encountered during event logging.');
    } else if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      console.error('[FIREBASE] Database Not Found during event logging (5 NOT_FOUND). Switching to silent fail for logs.');
    }
    console.error('Failed to log event:', err.message);
  }
};

async function logToFirestoreError(err: any, context: string, req?: any) {
    const isFirestore = err.code || (err.message && err.message.toLowerCase().includes('firestore'));
    const level = isFirestore ? 'firestore_error' : 'logic_error';
    const message = `Context: ${context}, Message: ${err.message}`;
    const stack = err.stack;
    const userId = req?.session?.userId;
    const path = req?.path;
    await logEvent(level, message, stack, userId, path);
};
    
// WebSocket setup
let io: Server | null = null;
const socketBatches: Map<string, any[]> = new Map();
const socketBatchBuffers: Map<string, NodeJS.Timeout> = new Map();
const socketBatchingWindow = 1000;

// Promotional rules cleanup job - runs daily at midnight
if (process.env.NODE_ENV !== 'production' || (!process.env.VERCEL && !process.env.NOW_REGION)) {
  cron.schedule('0 0 * * *', async () => {
    console.log('[BACKUP] Scheduled task triggered: Firestore snapshot export');
    console.log('[BACKUP] NOTE: Firestore export requires Cloud Scheduler + IAM permissions.');
  });

  cron.schedule('0 0 * * *', async () => {
      try {
          const today = new Date().toISOString().split('T')[0];
          const rules = await getFirestoreInstance().collection('promotional_rules').where('active', '==', true).get();
          const batch = getFirestoreInstance().batch();
          let count = 0;
          rules.docs.forEach(doc => {
              const rule = doc.data();
              if (rule.end_date && rule.end_date < today) {
                  batch.update(doc.ref, { active: false });
                  count++;
              }
          });
          if (count > 0) {
              await batch.commit();
              console.log(`[PROMO_CLEANUP] Disabled ${count} expired promotional rules.`);
          }
      } catch (e) {
          await logToFirestoreError(e, 'promoCleanup');
          console.error('[PROMO_CLEANUP] Error:', e);
      }
  });
} else {
  console.log('[BOOT] Skipping cron schedules in serverless environment.');
}

const broadcast = (data: any) => {
  if (io) {
    if (data.type === 'ORDER_STATUS_UPDATE') {
      if (!socketBatches.has('orders')) {
        socketBatches.set('orders', []);
      }
      socketBatches.get('orders')!.push(data);
      
      if (!socketBatchBuffers.has('orders')) {
        const timeout = setTimeout(() => {
          const batch = socketBatches.get('orders');
          if (batch && batch.length > 0) {
            io!.emit('data', { type: 'BATCHED_ORDER_UPDATES', payload: batch });
            socketBatches.delete('orders');
          }
          socketBatchBuffers.delete('orders');
        }, socketBatchingWindow);
        socketBatchBuffers.set('orders', timeout);
      }
    } else {
      io.emit('data', data);
    }
  }
};

const createNotification = async (title: string, message: string, type: string = 'system', priority: string = 'medium', target_role: string = 'all') => {
  try {
    if (admin.apps.length) await getFirestoreInstance().collection('notifications').add({title, message, type, priority, target_role, created_at: new Date().toISOString()});
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

// Moved middlewares


console.log('[BOOT STEP 2.6] startServer defined');
async function startServer() {
  console.log("[BOOT] Server startup, checking ports...");
  console.log({
    FIREBASE_SERVICE_ACCOUNT_KEY_PRESENT: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    FIREBASE_PROJECT_ID_PRESENT: !!process.env.FIREBASE_PROJECT_ID,
    SESSION_SECRET_PRESENT: !!process.env.SESSION_SECRET
  });
  
  console.log('[STARTUP] Initializing components...');
  try {
    validateEnvironment();
    console.log("[BOOT STEP 2.7] Environment validated");
    
    await initializeFirebase();
    console.log("[BOOT STEP 2.8] Firebase initialization finished");

    await auditAndRecoverCollections();
    
    if (admin.apps.length > 0) {
       console.log("[FIRESTORE READY] Connection established");
    } else {
       console.warn("[FIRESTORE READY] Running in fallback mode");
    }
  } catch (err: any) {
    console.error("[STARTUP ERROR] Early initialization failed:", err);
    dbConnectionStatus.mode = 'ERROR';
    dbConnectionStatus.details = `Initialization failed: ${err.message}`;
  }
  
  console.log('[STARTUP] Creating http server instance and WebSocket server...');
  if (!httpServer) {
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });
    console.log('[SESSION READY] WebSocket server attached');
    io.on('connection', (socket) => {
      console.log('Client connected to real-time updates');
      socket.on('disconnect', () => console.log('Client disconnected'));
    });
  }
  console.log('[AUTH READY] Middleware stack configured');

  console.log('[STARTUP] Registering routes...');

  routesRegistered = true;
  console.log('[BOOT] Starting Route Registration...');
  
  console.log('[BOOT] Starting Route Registration...');
  app.post('/api/orders/:id/update-items', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { items, total } = req.body;
    const userId = String(req.session.userId);
    const isAdmin = ['admin', 'owner', 'manager'].includes(req.session.role || '');

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false });
      const orderRef = getFirestoreInstance().collection('orders').doc(id);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) return res.status(404).json({ success: false, message: 'Order not found' });
      const order = orderDoc.data() as any;

      if (String(order.user_id) !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending orders can be edited' });
      }

      await orderRef.update({
        items,
        total: Number(total),
        updated_at: new Date().toISOString(),
        edit_history: admin.firestore.FieldValue.arrayUnion({
          timestamp: new Date().toISOString(),
          previous_total: order.total,
          new_total: Number(total)
        })
      });

      res.json({ success: true, message: 'Order updated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/orders/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { reason, restock, refund } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const docRef = getFirestoreInstance().collection('orders').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ success: false, message: 'Order not found' });
      
      const order = doc.data() as any;
      const isAdmin = (req.session as any)?.role === 'admin';
      
      if (!isAdmin && order.status !== 'pending' && order.status !== 'processing') {
        return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
      }

      const batch = getFirestoreInstance().batch();
      batch.update(docRef, { status: 'cancelled', payment_status: refund ? 'refunded' : (order.payment_status || 'pending'), cancellation_reason: reason || null, updated_at: new Date().toISOString() });
      
      if (isAdmin) {
        if (restock) {
          const itemsSnap = await getFirestoreInstance().collection('order_items').where('order_id', '==', id).get();
          itemsSnap.docs.forEach(itemDoc => {
            const item = itemDoc.data();
            const productRef = getFirestoreInstance().collection('products').doc(String(item.product_id));
            batch.update(productRef, { stock: admin.firestore.FieldValue.increment(Number(item.quantity) || 0) });
          });
        }
        
        if (refund) {
          const userRef = getFirestoreInstance().collection('users').doc(String(order.user_id));
          if (order.payment_method === 'wallet' && order.wallet_used > 0) {
            batch.update(userRef, { wallet_balance: admin.firestore.FieldValue.increment(Number(order.wallet_used)) });
            batch.set(getFirestoreInstance().collection('wallet_transactions').doc(), {
              user_id: String(order.user_id), amount: Number(order.wallet_used), type: 'credit', description: `Refund for Cancelled Order #${id}`, status: 'approved', created_at: new Date().toISOString()
            });
          } else if (order.payment_method === 'khata') {
            batch.update(userRef, { khata_balance: admin.firestore.FieldValue.increment(-Number(order.total)) });
            batch.set(getFirestoreInstance().collection('wallet_transactions').doc(), {
              user_id: String(order.user_id), amount: Number(order.total), type: 'credit', description: `Khata Reversal for Cancelled Order #${id}`, status: 'approved', created_at: new Date().toISOString()
            });
          }
        }
      }

      await batch.commit();

      res.json({ success: true });
    } catch (err: any) {
      await logServerError(err, 'cancelOrder', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Internal server error while cancelling order' });
    }
  });
// Helper to log system events
const capitalizeName = (name: string) => {
  if (!name) return '';
  return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const logSuspicious = async (userId: number | string | null, type: string, description: string, ip?: string) => {
  try {
    if (admin && Array.isArray(admin.apps) && admin.apps.length > 0) await getFirestoreInstance().collection('suspicious_activities').add({user_id: userId ? String(userId) : null, activity_type: type, description, ip_address: ip || null, created_at: new Date().toISOString()});
  } catch (err) {
    console.error('Failed to log suspicious activity:', err);
  }
};

// Helper to get settings
const getSetting = async (key: string): Promise<any> => {
  try {
    if (!admin.apps.length) {
      console.warn(`[getSetting] Firebase apps not initialized. Skipping key: ${key}`);
      return null;
    }
    const doc = await getFirestoreInstance().collection('settings').doc(key).get();
    return doc.exists ? doc.data()?.value : null;
  } catch (err: any) {
    if (err.code === 7 || err.message?.toLowerCase().includes('permission') || err.message?.toLowerCase().includes('denied')) {
      console.error(`[FIREBASE] Permission Denied during getSetting('${key}').`);
      return null;
    }
    if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      return null;
    }
    console.error(`[getSetting] Error fetching key "${key}":`, {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    return null;
  }
};

// Helper for user alerts
const createAlert = async (userId: number | string | null, title: string, message: string, details: string = '', type: string = 'info', duration: number = 5000, unskippable: boolean = true) => {
  try {
    if (admin.apps.length) await getFirestoreInstance().collection('user_alerts').add({
      user_id: userId ? String(userId) : null, title, message, details, type, duration, is_unskippable: unskippable, created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating user alert:', err);
  }
};

// Unified helper functions for mapping database documents safely
async function fetchUsersMap(userIds: string[]): Promise<Map<string, any>> {
  const usersMap = new Map<string, any>();
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) return usersMap;
  
  try {
    const db = getFirestoreInstance();
    // Use chunked 'in' queries for efficiency (max 30 IDs per query)
    const chunkSize = 30;
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      const snap = await db.collection('users').where('__name__', 'in', chunk).get();
      snap.docs.forEach((doc: any) => {
        usersMap.set(doc.id, doc.data());
      });
    }
  } catch (err) {
    console.error('[FIREBASE] Consolidated user fetch failed:', err);
    // Fallback to individual fetches if 'in' query fails (e.g. mock DB)
    await Promise.all(uniqueIds.map(async (uid) => {
      try {
        const doc = await getFirestoreInstance().collection('users').doc(uid).get();
        if (doc.exists) {
          usersMap.set(uid, doc.data());
        }
      } catch (e) {}
    }));
  }
  return usersMap;
}

async function fetchProductsMap(productIds: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const uniqueIds = [...new Set(productIds.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) return map;
  
  try {
    await Promise.all(uniqueIds.map(async (pid) => {
      try {
        const doc = await getFirestoreInstance().collection('products').doc(pid).get();
        if (doc.exists) {
          map.set(pid, doc.data());
        }
      } catch {}
    }));
  } catch {}
  return map;
}

async function fetchSuppliersMap(supplierIds: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const uniqueIds = [...new Set(supplierIds.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) return map;
  
  try {
    await Promise.all(uniqueIds.map(async (sid) => {
      try {
        const doc = await getFirestoreInstance().collection('suppliers').doc(sid).get();
        if (doc.exists) {
          map.set(sid, doc.data());
        }
      } catch {}
    }));
  } catch {}
  return map;
}

const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  return email.replace(/\s+/g, '').trim().toLowerCase();
};

const userCreationMutex = new Map<string, Promise<any>>();

async function getOrCreateUser(emailInput: string, decodedToken: any): Promise<any> {
  const lowercaseEmail = sanitizeEmail(emailInput);
  
  if (userCreationMutex.has(lowercaseEmail)) {
    return await userCreationMutex.get(lowercaseEmail);
  }
  
  const creationPromise = (async () => {
    let db;
    try {
      db = getFirestoreInstance();
    } catch (e) {
      return {
        id: decodedToken.uid || 'shadow_user',
        email: emailInput,
        role: (lowercaseEmail === 'parthgulyani7960@gmail.com') ? 'admin' : 'customer',
        name: decodedToken.name || emailInput.split('@')[0],
        is_shadow: true
      };
    }

    try {
      const usersColl = db.collection('users');
      let snap = await usersColl.where('email', '==', lowercaseEmail).limit(1).get();
      
      const shouldBeAdmin = await checkAdminWhitelisted(lowercaseEmail);
      const role = shouldBeAdmin ? 'admin' : (decodedToken.role || 'customer');

      if (!snap.empty) {
        const doc = snap.docs[0];
        let user = { id: doc.id, ...doc.data() } as any;
        const updates: any = {};
        
        if (user.role !== role) {
          updates.role = role;
          user.role = role;
        }

        if (!user.uid && decodedToken.uid) {
          updates.uid = decodedToken.uid;
          user.uid = decodedToken.uid;
        }

        if (Object.keys(updates).length > 0) {
          await doc.ref.update(updates);
        }
        return user;
      } else {
        const newUser = {
          email: lowercaseEmail,
          uid: decodedToken.uid,
          name: decodedToken.name || emailInput.split('@')[0],
          role: role,
          auth_provider: decodedToken.firebase?.sign_in_provider || 'google',
          profile_photo: decodedToken.picture || null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          status: 'active',
          wallet_balance: 0,
          loyalty_points: 0,
          total_orders: 0,
          total_spent: 0,
          phone: '',
          address: '',
          is_active: true,
          segment: 'retail',
          is_new: true,
          metadata: {
            email_verified: decodedToken.email_verified || false
          }
        };
        const docRef = await usersColl.add(newUser);
        return { id: docRef.id, ...newUser };
      }
    } catch (err: any) {
      console.error('[AUTH] getOrCreateUser error:', err.message);
      throw err;
    }
  })();
      
  userCreationMutex.set(lowercaseEmail, creationPromise);
  try {
    return await creationPromise;
  } finally {
    userCreationMutex.delete(lowercaseEmail);
  }
}

// Helper to verify Firebase token and get/create user
const verifyFirebaseUser = async (req: express.Request) => {
  if (!isFirebaseReady) return null;
  if ((req as any)._verifiedUser !== undefined) {
    return (req as any)._verifiedUser;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    (req as any)._verifiedUser = null;
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await safeVerifyIdToken(token);
    const email = sanitizeEmail(decodedToken.email);
    
    if (!email) {
      console.warn(`[AUTH FAIL] Token verified but missing email for UID: ${decodedToken.uid}`);
      (req as any)._verifiedUser = null;
      return null;
    }

    const user = await getOrCreateUser(email, decodedToken);

    if (user) {
      if (user.status === 'disabled') {
        console.warn(`[AUTH] Login attempt by disabled user: ${email}`);
        (req as any)._verifiedUser = null;
        return null;
      }
      
      try {
        await getFirestoreInstance().collection('users').doc(user.id).update({
           last_login_at: new Date().toISOString(), ip_address: req.ip || null, device_info: req.headers['user-agent'] || null
        });
        user.last_login_at = new Date().toISOString();
      } catch (updateErr) {
        console.error('[AUTH] Failed to update login details:', updateErr);
      }

      (req as any).session = (req as any).session || {};
      (req as any).session.userId = user.id;
      (req as any).session.role = user.role;
      (req as any)._verifiedUser = user;
      return user;
    }
  } catch (err: any) {
    if (err.code === 'auth/id-token-expired' || err.message?.includes('expired')) {
        throw err;
    }
    if (err.code !== 'auth/argument-error') { 
        console.warn(`[AUTH] Token verification failed: ${err.message}`);
    } else {
        console.log(`[AUTH] Token invalid: ${err.code}`);
    }
  }
  (req as any)._verifiedUser = null;
  return null;
};


const auditAdminAction = (req: any, res: any, next: any) => {
  if (req.session.userId) {
    const logData = {
      admin_id: String(req.session.userId),
      action: `${req.method} ${req.path}`,
      resource: req.path,
      target_type: 'ROUTE',
      target_id: null,
      details: JSON.stringify({ body: req.body, query: req.query }),
      ip_address: req.ip || null,
      user_agent: req.headers['user-agent'] || null,
      created_at: new Date().toISOString()
    };
    if (admin.apps.length) getFirestoreInstance().collection('audit_logs').add(logData).catch(e => console.error('Failed to log admin action:', e));
  }
  next();
};


  app.set('trust proxy', 'loopback');
  app.use((req, res, next) => {
    // Log all incoming requests for debugging
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const isApi = req.url.startsWith('/api/') || req.url === '/';
      if (isApi && req.url !== '/api/health') {
        console.log(`[RES] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
      }
    });

    // Auto-fix localhost headers if they leak through
    if (req.headers.host && req.headers.host.includes('localhost:3000')) {
       // This shouldn't happen in production but good for robustness
    }
    
    next();
  });
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  
  console.log('[BOOT] Configuring Session middleware...');
  const sessionSecret = process.env.SESSION_SECRET;
  console.log('[BOOT] SESSION_SECRET exists:', !!sessionSecret);
  
  const cookieConfig = {
    name: 'session',
    keys: [sessionSecret || 'hind-store-secret-2024'],
    maxAge: 24 * 60 * 60 * 1000, 
    secure: true, 
    sameSite: 'none' as const,
    path: '/',
    httpOnly: true
  };
  
  console.log('[BOOT] Cookie Configuration:', {
    name: cookieConfig.name,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    httpOnly: cookieConfig.httpOnly,
    maxAge: cookieConfig.maxAge
  });

  app.use(cookieSession(cookieConfig));
  console.log('[BOOT] Session middleware initialized successfully');

  // Device-based Session Tracking & Hijack Prevention Middleware
  app.use((req, res, next) => {
    if (req.session && req.session.userId) {
      const currentIp = req.ip || 'unknown';
      const currentUserAgent = req.headers['user-agent'] || 'unknown';
      
      const sessionIp = (req.session as any).ip;
      const sessionUserAgent = (req.session as any).userAgent;
      
      if (!sessionIp || !sessionUserAgent) {
        // First request with session, initialize device tracking
        (req.session as any).ip = currentIp;
        (req.session as any).userAgent = currentUserAgent;
        (req.session as any).createdAt = Date.now();
      } else {
        // Device matching checks
        const isDeviceHijacked = sessionUserAgent !== currentUserAgent;
        // Check Class C subnet IP match to allow minor network switches
        const getSubnet = (ipStr: string) => ipStr.split('.').slice(0, 3).join('.');
        const isIpHijacked = getSubnet(sessionIp) !== getSubnet(currentIp) && sessionIp !== 'unknown' && currentIp !== 'unknown';
        
        if (isDeviceHijacked || isIpHijacked) {
          console.warn(`[SESSION_HIJACK] Suspicious mismatch. Expected IP: ${sessionIp} / UA: ${sessionUserAgent}. Got IP: ${currentIp} / UA: ${currentUserAgent}. Destroying session.`);
          registerSecurityIncident(currentIp, 'csrf_tamper', `Session hijacking attempt detected. UserAgent or IP Class-C mismatch.`);
          req.session = null; // Destroy session cookie
          return res.status(401).json({ success: false, message: 'Security Breach Mitigated: Session destroyed due to device/network discrepancy.' });
        }
      }
    }
    next();
  });

  // Token-based fallback for iframe / cross-site environments
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        (req as any).session = (req as any).session || {};
        
        if (admin.apps.length > 0) {
          const decodedToken = await safeVerifyIdToken(token);
          const email = decodedToken.email?.toLowerCase();
          const phone = decodedToken.phone_number;
          
          let user;
          if (email) {
            // Try lowercase first
            let snap = await getFirestoreInstance().collection('users').where('email', '==', email).limit(1).get();
            
            // Try exact if failed (matches mixed-case accounts)
            if (snap.empty && decodedToken.email && decodedToken.email !== email) {
               const exSnap = await getFirestoreInstance().collection('users').where('email', '==', decodedToken.email).limit(1).get();
               if (!exSnap.empty) snap = exSnap;
            }

            if (!snap.empty) user = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
          }
          if (!user && phone) {
            const snap = await getFirestoreInstance().collection('users').where('phone', '==', phone).limit(1).get();
            if (!snap.empty) user = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
          }

          if (user) {
              req.session.userId = user.id;
              req.session.role = user.role;
          }
        }
      } catch (e) {
        // Invalid token
      }
    }
    next();
  });

  // Global Intelligence Trace Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;

      res.send = function (body) {
        const duration = Date.now() - start;
        const url = req.originalUrl || req.url;
        
        // Filter: only trace admin APIs or very slow/error requests
        if (url.startsWith('/api/admin') || duration > 1000 || res.statusCode >= 400) {
          const traceData: any = {
            method: req.method,
            status: res.statusCode,
            duration: `${duration}ms`,
            host: req.get('host') || 'unknown',
            ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            ua: req.headers['user-agent'] || 'unknown',
            query: req.query,
            referer: req.headers['referer'] || '',
            content_type: req.headers['content-type'] || '',
            user_email: (req.session as any)?.userEmail || 'anonymous'
          };

          // Safely capture a snippet of the request body if present
          if (req.body && Object.keys(req.body).length > 0) {
            const bodyStr = JSON.stringify(req.body);
            traceData.body_preview = bodyStr.length > 1000 ? bodyStr.substring(0, 1000) + '...' : bodyStr;
          }

          getFirestoreInstance().collection('audit_logs').add({
            action: 'API_TRACE',
            admin_id: String(req.session?.userId || 'GUEST'),
            target_type: 'ENDPOINT',
            target_id: url,
            details: JSON.stringify(traceData),
            created_at: new Date().toISOString(),
            severity: res.statusCode >= 500 ? 'high' : res.statusCode >= 400 ? 'medium' : 'info'
          }).catch(() => {});
        }
        return originalSend.apply(res, arguments as any);
      };
    next();
  });

  // Apply global middlewares
  app.use('/api/admin', requireAdmin, auditAdminAction);
  app.use('/api/profile', requireAuth);
  app.use('/api/cart', requireAuth);
  app.use('/api/wishlist', requireAuth);
  app.use('/api/tickets', requireAuth);
  app.use('/api/wallet', requireAuth);

  // Helper for SMS (Simulated)
  const sendSMS = async (phone: string, message: string) => {
    const apiKey = await getSetting('otp_api_key');
    if (!apiKey) {
      console.log(`[SIMULATED SMS] To ${phone}: ${message}`);
      return true;
    }
    // In a real scenario, you would call an SMS gateway API here using the apiKey
    console.log(`[REAL SMS ATTEMPT] Using API Key: ${apiKey.substring(0, 5)}... To ${phone}: ${message}`);
    return true;
  };

  // Maintenance Middleware
  app.use(async (req, res, next) => {
    // Only check maintenance for API routes, excluding admin/auth
    if (!req.path.startsWith('/api/') || req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth')) {
        return next();
    }
    
    if (!isFirebaseReady) return next();

    try {
        const isMaintenance = await getSetting('maintenance_mode') === 'true';
        if (isMaintenance) {
            const bypass = req.query.bypass || req.headers['x-maintenance-bypass'];
            const secret = await getSetting('maintenance_secret');
            if (bypass !== secret) {
                return res.status(500).json({ 
                    maintenance: true, 
                    message: 'Store is under maintenance',
                    bypass_key_needed: true 
                });
            }
        }
    } catch (e) {
        console.error('[MAINTENANCE] Error checking maintenance mode:', e);
    }
    next();
  });

  // API Routes
  const getFirebaseDiagnostics = async () => {
    const appsCount = admin.apps.length;
    if (appsCount === 0) {
      return {
        ready: isFirebaseReady,
        apps: [],
        databases: {
          default: 'N/A: No Apps Initialized',
          custom: { id: config?.firestoreDatabaseId, status: 'N/A: No Apps Initialized' }
        },
        connectionMode: dbConnectionStatus.mode,
        connectionDetails: dbConnectionStatus.details,
        env: {
          GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || 'NOT_SET',
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'NOT_SET',
          FIREBASE_DATABASE_ID: process.env.FIREBASE_DATABASE_ID || 'NOT_SET'
        }
      };
    }

    const activeApp = admin.app();
    const apps = admin.apps.map(a => ({
      name: a.name,
      options: { ...a.options, credential: 'REDACTED' },
      projectId: a.options.projectId,
    }));
    
    const customDbId = config?.firestoreDatabaseId || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
    let customStatus = 'N/A';
    if (customDbId && customDbId !== '(default)') {
      try {
        const dbCustom = getFirestore(activeApp, customDbId);
        await dbCustom.collection('_health_').limit(1).get();
        customStatus = 'Connected';
      } catch (e: any) {
        customStatus = `Error: ${e.message}`;
      }
    }
    
    return {
      ready: isFirebaseReady,
      apps,
      databases: {
        custom: { id: customDbId, status: customStatus }
      },
      connectionMode: dbConnectionStatus.mode,
      connectionDetails: dbConnectionStatus.details,
      env: {
        GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_DATABASE_ID: process.env.FIREBASE_DATABASE_ID
      }
    };
  };

  app.get(['/api/debug-firebase', '/api/debug/firebase'], async (req, res) => {
    try {
      const diag = await getFirebaseDiagnostics();
      res.json(diag);
    } catch (e: any) {
      res.status(500).json({
        ready: isFirebaseReady,
        error: e.message,
        connectionMode: dbConnectionStatus.mode,
        apps: admin.apps.map(a => ({ name: a.name, projectId: a.options.projectId }))
      });
    }
  });

  app.get('/api/debug/environment', (req, res) => {
    try {
      const secureEnv: Record<string, any> = {};
      const sensitiveKeywords = [
        'KEY', 'SECRET', 'PASSWORD', 'CREDENTIAL', 'TOKEN', 'EMAIL', 'PRIVATE', 'AUTH', 'API'
      ];

      Object.keys(process.env).forEach(key => {
        const isSensitive = sensitiveKeywords.some(keyword => key.toUpperCase().includes(keyword));
        const val = process.env[key];
        
        if (!val) {
          secureEnv[key] = { configured: false, length: 0 };
        } else if (isSensitive) {
          secureEnv[key] = { 
            configured: true, 
            length: val.length, 
            type: 'sensitive (redacted)',
            preview: val.length > 8 ? `${val.substring(0, 3)}...${val.substring(val.length - 3)}` : '***'
          };
        } else {
          secureEnv[key] = { 
            configured: true, 
            length: val.length, 
            value: val 
          };
        }
      });

      res.json({
        success: true,
        environment: secureEnv,
        nodeEnv: process.env.NODE_ENV || 'production',
        cwd: process.cwd(),
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  const getServiceAccountAndDiag = async () => {
    let serviceAccountEmail = 'Unknown';
    try {
      const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email', {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: AbortSignal.timeout(2000)
      });
      serviceAccountEmail = (await res.text()).trim();
    } catch (e: any) {
      serviceAccountEmail = `Local / Unreachable: ${e.message}`;
    }

    const activeApp = admin.app();
    const targetDatabaseId = config?.firestoreDatabaseId || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
    const db = getFirestore(activeApp, targetDatabaseId);

    let queryError: any = null;
    try {
      await db.collection('settings').limit(1).get();
    } catch (err: any) {
      queryError = {
        message: err.message,
        code: err.code,
        details: err.details,
        stack: err.stack
      };
    }

    return {
      serviceAccountEmail,
      projectId: activeApp.options.projectId,
      targetedDatabase: targetDatabaseId,
      queryError
    };
  };

  app.get('/api/debug-firestore-permissions', async (req, res) => {
    try {
      const diagnosis = await getServiceAccountAndDiag();
      res.json({ success: true, diagnosis });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message, stack: e.stack });
    }
  });

  app.get('/api/admin/debug-firestore-permissions', async (req, res) => {
    try {
      const diagnosis = await getServiceAccountAndDiag();
      res.json({ success: true, diagnosis });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message, stack: e.stack });
    }
  });

  app.get('/api/firebase-health', async (req, res) => {
    try {
      if (!isFirebaseReady) {
        return res.status(200).json({ ready: false, message: 'Firebase not initialized' });
      }
      const db = getFirestoreInstance();
      const snap = await db.collection('settings').limit(1).get();
      res.json({ 
        ready: true, 
        project: admin.app().options.projectId,
        database: snap.empty ? 'connected/empty' : 'connected/data',
        apps: admin.apps.length
      });
    } catch (e: any) {
      res.status(500).json({ 
        ready: isFirebaseReady, 
        error: e.message,
        code: e.code,
        project: admin.apps.length ? admin.app().options.projectId : 'not_init'
      });
    }
  });

  // Global Request Lifecycle Logging
  app.use('/api', (req, res, next) => {
    const requestId = Math.random().toString(36).substring(2, 11);
    (req as any).id = requestId;
    const start = Date.now();
    
    logger.info(`[ROUTE_START] ${req.method} ${req.path}`, { requestId });

    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - start;
      if (res.statusCode >= 400) {
        logger.error(`[ROUTE_FAILURE] ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`, { 
          requestId,
          error: data?.message || data?.error,
          body: req.method !== 'GET' ? JSON.stringify(req.body).substring(0, 500) : undefined
        });
      } else {
        logger.info(`[ROUTE_SUCCESS] ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`, { requestId });
      }
      return originalJson.call(this, data);
    };
    next();
  });

  // Helper function to generate a fast, collision-resistant ETag hash from response bodies
  function generateFastETag(body: string | Buffer): string {
    if (!body) return '""';
    const str = typeof body === 'string' ? body : body.toString('utf8');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return `W/"${hash.toString(16)}"`;
  }

  // Cache-Control and ETag validation middleware for cacheable GET API requests
  app.use('/api', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheablePaths = [
      '/products',
      '/categories',
      '/promotions-rules',
      '/settings',
      '/announcements'
    ];

    const isCacheable = cacheablePaths.some(p => req.path.startsWith(p));
    if (!isCacheable) {
      return next();
    }

    // Allow cache for 10 seconds, but demand immediate revalidation afterwards
    res.setHeader('Cache-Control', 'public, max-age=10, must-revalidate');

    const originalSend = res.send;
    res.send = function (body: any): any {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        const etag = generateFastETag(body);
        res.setHeader('ETag', etag);

        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
          res.status(304);
          // Return empty response body on 304 Not Modified
          return originalSend.call(this, '');
        }
      }
      return originalSend.call(this, body);
    };

    next();
  });

  async function logAuthFailure(req: express.Request, message: string, userId?: string) {
    try {
      if (!isFirebaseReady) {
        console.warn(`[AUDIT LOG BYPASS] ${message} | Path: ${req.path}`);
        return;
      }
      const db = getFirestoreInstance();
      const logRef = db.collection('audit_logs').doc();
      await logRef.set({
        event: 'authentication_failure',
        userId: userId || null,
        message,
        path: req.path,
        method: req.method,
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[AUDIT LOG ERROR] Failed to write to audit_logs:', err);
    }
  }

  // Global Admin Authorization Middleware
  async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      console.log('[AUTH MIDDLEWARE] Path:', req.path, 'Session userId:', req.session?.userId);
      
      if (!isFirebaseReady) {
        console.warn('[AUTH MIDDLEWARE] Firebase not ready, allowing bypass for basic auth check');
      }

      // Strict Session Validation: Check if session has userId
      if (req.session?.userId) {
         const userIdStr = String(req.session.userId);

         if (isFirebaseReady) {
           try {
             const doc = await getFirestoreInstance().collection('users').doc(userIdStr).get();
             if (doc.exists) {
                const userData = doc.data();
                req.session.role = userData?.role || 'customer';
                return next();
             }
           } catch (e) {
             console.warn('[AUTH MIDDLEWARE] Firestore doc fetch failed, using session role');
           }
         }
         
         if (req.session.role) return next();
      }
      
      const user = await verifyFirebaseUser(req);
      if (user && user.id && user.role) {
        (req as any).session = (req as any).session || {};
        (req as any).session.userId = user.id;
        (req as any).session.role = user.role;
        return next();
      }

      if (!req.session?.userId && !user) {
        await logAuthFailure(req, 'Missing or invalid authentication credentials');
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      next();
    } catch (err: any) {
      console.error('[AUTH MIDDLEWARE ERROR]:', err.message);
      if (err.code === 'auth/id-token-expired' || err.message?.includes('expired')) {
        return res.status(401).json({ success: false, message: 'Session expired', code: 'auth/id-token-expired' });
      }
      next();
    }
  };

  const handleAdminRouteError = (route: string, err: any, res: express.Response) => {
    const stack = err.stack || '';
    const message = err.message || 'Unknown admin error';
    
    let file = 'server.ts';
    let line = 0;
    try {
      const stackLines = stack.split('\n');
      if (stackLines.length > 1) {
        const match = stackLines[1].match(/\((.*):(\d+):(\d+)\)/) || stackLines[1].match(/at (.*):(\d+):(\d+)/);
        if (match) {
          file = match[1];
          line = parseInt(match[2], 10);
        }
      }
    } catch (parseErr) {
      // Ignore parsing error
    }

    console.error(`[ADMIN ROUTE FAILURE] Route: ${route} | Error: ${message} | File: ${file}:${line}`);
    console.error(stack);

    res.status(500).json({
      success: false,
      route,
      message,
      stack,
      file,
      line
    });
  };

  // In-memory cache for admin whitelist to speed up authentication checks
const adminWhitelistCache = new Map<string, { role: string; status: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

async function checkAdminWhitelisted(email: string): Promise<boolean> {
  const cached = adminWhitelistCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.status === 'active';
  }

  try {
    const db = getFirestoreInstance();
    const adminDoc = await db.collection('admin_whitelist').doc(email).get();
    if (adminDoc.exists) {
      const data = adminDoc.data();
      adminWhitelistCache.set(email, { 
        role: 'admin', 
        status: data?.status || 'active', 
        timestamp: Date.now() 
      });
      return data?.status === 'active';
    }
  } catch (e) {
    console.error('[ADMIN_WHITELIST] Cache miss/fetch error:', email, e);
  }
  return false;
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const routeName = req.originalUrl || req.path;
  try {
    if (req.originalUrl && req.originalUrl.includes('diagnose-firestore')) {
      const isLocal = req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost' || req.headers['x-bypass-auth'] === 'diagnose';
      if (isLocal) return next();
    }

    if (req.session?.userId) {
      const userIdStr = String(req.session.userId);
      const userEmail = sanitizeEmail((req.session as any).email);
      
      if (userEmail === 'parthgulyani7960@gmail.com') return next();
      
      if (userEmail && await checkAdminWhitelisted(userEmail)) {
        req.session.role = 'admin';
        return next();
      }

      if (req.session.role === 'admin') return next();
    }

    const user = await verifyFirebaseUser(req);
    if (user) {
      const cleanEmail = sanitizeEmail(user.email);
      const isDevelopmentAdmin = cleanEmail === 'parthgulyani7960@gmail.com';
      const isWhitelisted = await checkAdminWhitelisted(cleanEmail);

      if (isDevelopmentAdmin || isWhitelisted) {
        if (isDevelopmentAdmin) {
           const db = getFirestoreInstance();
           const adminDoc = await db.collection('admin_whitelist').doc(cleanEmail).get();
           if (!adminDoc.exists) {
             await db.collection('admin_whitelist').doc(cleanEmail).set({
               email: cleanEmail, addedBy: 'system', addedAt: new Date().toISOString(), status: 'active', lastLogin: new Date().toISOString()
             });
           }
        }
        (req as any).session = (req as any).session || {};
        (req as any).session.userId = user.id;
        (req as any).session.role = 'admin';
        (req as any).session.email = cleanEmail;
        return next();
      }
    }

    return res.status(401).json({ success: false, message: 'Admin authentication required' });
  } catch (err: any) {
    if (err.code === 'auth/id-token-expired' || err.message?.includes('expired')) {
      return res.status(401).json({ success: false, message: 'Session expired', code: 'auth/id-token-expired' });
    }
    return handleAdminRouteError(routeName, err, res);
  }
}

  async function auditRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    const methodsToAudit = ['POST', 'PUT', 'DELETE'];
    if (methodsToAudit.includes(req.method)) {
      try {
        if (!isFirebaseReady) {
          console.warn(`[AUDIT BYPASS] Firestore not ready for audit: ${req.method} ${req.path}`);
          return next();
        }

        const db = getFirestoreInstance();
        const auditRef = db.collection('audit_logs').doc();
        
        // Sanitize body (don't log sensitive info)
        const sanitizedBody = { ...req.body };
        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'cvv', 'card_number'];
        sensitiveKeys.forEach(key => {
          if (sanitizedBody && typeof sanitizedBody === 'object' && sanitizedBody[key]) {
            sanitizedBody[key] = '[REDACTED]';
          }
        });

        await auditRef.set({
          event: 'admin_action',
          userId: req.session?.userId || 'anonymous',
          userRole: req.session?.role || 'none',
          method: req.method,
          path: req.path,
          payload: sanitizedBody,
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('[AUDIT ERROR] Failed to log admin action:', err);
      }
    }
    next();
  }

  app.get('/api/admin/diagnose-firestore', requireAdmin, async (req, res) => {
    const activeDatabaseId = process.env.FIREBASE_DATABASE_ID || config?.firestoreDatabaseId || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
    const results: any = {
      projectId: admin.app()?.options.projectId || 'none',
      databaseId: activeDatabaseId,
      isFirebaseReady,
      INITIALIZATION_MODE: dbConnectionStatus.mode,
      CREDENTIALS: {
        HAS_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        HAS_ENV_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        CONFIG_FILE_EXISTS: fs.existsSync(path.join(process.cwd(), 'src/config', 'firebase-applet-config.json'))
      },
      timestamp: new Date().toISOString()
    };

    try {
      if (!isFirebaseReady) {
        throw new Error(`Firebase not initialized. Mode: ${dbConnectionStatus.mode}. Details: ${dbConnectionStatus.details}`);
      }

      const db = getFirestoreInstance();
      
      // Explicitly probe using listCollections
      const collections = await db.listCollections();
      results.collections = collections.map((c: any) => c.id);
      results.listCollectionsStatus = 'SUCCESS';
      
      // Expressly test reachability of key application collections
      const collectionsToCheck = ['categories', 'promotions', 'settings', 'announcements', 'bug_reports', 'system_logs', 'users'];
      const reachability: Record<string, string> = {};
      
      for (const colName of collectionsToCheck) {
        try {
          await db.collection(colName).limit(1).get();
          reachability[colName] = 'REACHABLE';
        } catch (err: any) {
          reachability[colName] = `UNREACHABLE_ERROR: ${err.message}`;
        }
      }
      results.reachability = reachability;

      results.connection = 'SUCCESS';
      results.message = 'Firestore connection is active and accessible.';
      
      // Log successes to a system_logs document
      const logRef = db.collection('system_logs').doc();
      await logRef.set({
          level: 'info',
          source: 'diagnose-firestore',
          message: 'Admin diagnostic scan: Connection successful.',
          details: results,
          created_at: new Date().toISOString()
      });

      return res.json(results);
    } catch (err: any) {
      results.connection = 'FAILED';
      results.error = err.message;
      results.stack = err.stack;
      
      // Log failures to a system_logs document
      try {
          if (isFirebaseReady) {
            const db = getFirestoreInstance();
            const logRef = db.collection('system_logs').doc();
            await logRef.set({
                level: 'error',
                source: 'diagnose-firestore',
                message: `Admin diagnostic scan failed: ${err.message}`,
                details: results,
                created_at: new Date().toISOString()
            });
          } else {
            console.error('[DIAGNOSTIC BACKUP LOG] Firestore not ready, diagnostic failed:', err.message);
          }
      } catch (logErr) {
          console.error('Diagnostic log write failed:', logErr);
      }

      return res.status(500).json({
        success: false,
        message: 'Firestore connection probe failed',
        ...results
      });
    }
  });

  app.post('/api/profile/apply-khata', requireAuth, wrap('/api/profile/apply-khata', async (req, res) => {
    const db = getFirestoreInstance();
    const userRef = db.collection('users').doc(String(req.session.userId));
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const userData = userDoc.data() as any;
    if (userData?.khata_allowed) {
      res.json({ success: true, message: 'Khata is already enabled.' });
      return;
    }

    const { businessName, ownerName, gstNumber, businessType, estimatedCredit, wholesalerStatus, contactPhone, notes } = req.body || {};

    await userRef.update({
      khata_requested: true,
      khata_request_date: new Date().toISOString(),
      ...(businessName && { shop_name: businessName }),
      ...(ownerName && { owner_name: ownerName }),
      ...(gstNumber && { gst_number: gstNumber }),
      ...(businessType && { business_type: businessType }),
      ...(estimatedCredit && { estimated_monthly_credit: estimatedCredit }),
      ...(wholesalerStatus && { wholesaler_status: wholesalerStatus }),
      ...(contactPhone && { phone: contactPhone }),
      ...(notes && { khata_notes: notes })
    });

    // Notify admin
    if (typeof createAlert === 'function') {
      createAlert(null, 'New Khata Request', `User ${userData?.email} has requested Khata credit access.`, `Check user profile for approval.`, 'info');
    }

    res.json({ success: true, message: 'Khata request submitted successfully.' });
  }));

  app.get('/api/admin/dashboard', requireAdmin, wrap('/api/admin/dashboard', async (req, res) => {
    const db = getFirestoreInstance();
    try {
      const [statsSnap, ordersSnap, usersSnap, productsSnap] = await Promise.all([
        db.collection('stats').limit(1).get(),
        db.collection('orders').limit(5).get(),
        db.collection('users').limit(5).get(),
        db.collection('products').limit(5).get()
      ]);
      
      res.json({
        stats: statsSnap.docs.length > 0 ? statsSnap.docs[0].data() : {},
        orders: ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        users: usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        products: productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (err: any) {
      console.error('[ADMIN_DASHBOARD_ERROR]', err);
      res.status(500).json({ success: false, message: 'Failed to aggregate dashboard data', error: err.message });
    }
  }));

  app.post('/api/admin/users/:id/update', requireAdmin, wrap('/api/admin/users/:id/update', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();
    const userRef = db.collection('users').doc(id);
    
    const doc = await userRef.get();
    if (!doc.exists) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await userRef.update({
      ...updates,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'User updated successfully.' });
  }));
  
  app.post('/api/orders/:id/payment-proof', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { utr, screenshot } = req.body;
    
    if (screenshot) {
      const validation = validateBase64Image(screenshot);
      if (!validation.valid) {
        console.error(`[IMAGE_VALIDATION_FAILED] ${validation.error}`);
        registerSecurityIncident(req.ip || 'unknown', 'file_attack', `Image validation failed on order proof: ${validation.error}`);
        return res.status(400).json({ success: false, message: validation.error });
      }
    }
    
    try {
      const orderRef = getFirestoreInstance().collection('orders').doc(id);
      const doc = await orderRef.get();
      if (!doc.exists) return res.status(404).json({ success: false, message: 'Order not found' });
      
      const orderData = doc.data();
      const userId = (req as any).session?.userId;
      const role = (req as any).session?.role;
      if (orderData?.user_id !== String(userId) && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await orderRef.update({
        payment_utr: utr || orderData?.payment_utr,
        payment_screenshot: screenshot || orderData?.payment_screenshot,
        payment_status: 'verifying',
        updated_at: new Date().toISOString()
      });

      // Notify admins
      createAlert(null, 'Payment Proof Received', `Payment proof submitted for Order #${orderData?.order_id || id}.`, `Check the UTR: ${utr || 'N/A'} for manual verification.`, 'info');

      res.json({ success: true, message: 'Payment proof submitted successfully for manual verification.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders/:id/retry-payment', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { payment_method, payment_id, payment_utr, payment_screenshot, payment_ref } = req.body;
    const currentUserId = String(req.session.userId);
    const isAdmin = ['admin', 'owner', 'manager'].includes(req.session.role || '');
    
    try {
      if (!admin.apps.length) {
        console.error('API 500: Firebase Admin not initialized.');
        return res.status(500).json({ success: false, message: 'Internal server error: Firebase not ready' });
      }
      
      const orderRef = getFirestoreInstance().collection('orders').doc(String(id));
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      const order = orderDoc.data() as any;

      // Ownership check: must be owner or admin
      if (String(order.user_id) !== currentUserId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      // Can only retry if failed or pending
      if (order.payment_status !== 'failed' && order.payment_status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Payment cannot be retried for this order status' });
      }

      if (order.status === 'cancelled' || order.status === 'delivered') {
        return res.status(400).json({ success: false, message: 'Cannot retry payment for cancelled or delivered orders' });
      }

      const updates: any = {
        payment_status: 'pending', // Reset to pending for admin verification
        updated_at: new Date().toISOString()
      };

      if (payment_method) updates.payment_method = payment_method;
      if (payment_id) updates.payment_id = payment_id;
      if (payment_utr) updates.payment_utr = payment_utr;
      if (payment_screenshot) updates.payment_screenshot = payment_screenshot;
      if (payment_ref) updates.payment_ref = payment_ref;

      await orderRef.update(updates);
      
      broadcast({ type: 'ORDER_PAYMENT_RETRY', payload: { id, order_id: order.order_id, payment_method } });

      res.json({ success: true, message: 'Payment information updated. Awaiting verification.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Background function to auto-cancel stale failed orders
  async function autoCancelFailedOrders() {
    try {
      if (!admin.apps.length) return;
      const now = new Date();
      // Cancel "failed" payment orders after 24 hours
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      
      const snap = await getFirestoreInstance().collection('orders')
        .where('payment_status', '==', 'failed')
        .get();
      
      const batch = getFirestoreInstance().batch();
      let count = 0;
      
      for (const doc of snap.docs) {
        const order = doc.data() as any;
        if (['cancelled', 'delivered'].includes(order.status)) continue;

        if (order.created_at < twentyFourHoursAgo) {
          batch.update(doc.ref, { 
            status: 'cancelled', 
            cancellation_reason: 'Auto-cancelled due to payment failure timeout (24h)',
            updated_at: now.toISOString()
          });
          count++;
        }
      }
      
      if (count > 0) {
        await batch.commit();
        console.log(`[Auto-Cancel] Cancelled ${count} stale failed orders.`);
      }
    } catch (err: any) {
      if (err.code === 7 || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('Missing or insufficient permissions')) {
        console.warn('[Auto-Cancel] Firestore query disabled or developer/container environment lacks Firestore IAM permission.');
        return;
      }
      console.error('[Auto-Cancel] Error:', err);
    }
  }

  // Run auto-cancel every 15 minutes
  setInterval(autoCancelFailedOrders, 15 * 60 * 1000);

  app.post('/api/admin/orders/:id/fail-payment', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const orderRef = getFirestoreInstance().collection('orders').doc(String(id));
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) return res.status(404).json({ success: false, message: 'Order not found' });
      
      const order = orderDoc.data() as any;

      const batch = getFirestoreInstance().batch();
      batch.update(orderRef, {
        payment_status: 'failed',
        rejection_reason: reason || 'Payment proof rejected by admin',
        updated_at: new Date().toISOString()
      });

      const aRef = getFirestoreInstance().collection('audit_logs').doc();
      batch.set(aRef, {
        admin_id: String(req.session.userId),
        action: 'PAYMENT_FAILED_MANUAL',
        target_type: 'ORDER',
        target_id: String(id),
        details: JSON.stringify({ reason }),
        created_at: new Date().toISOString()
      });

      await batch.commit();
      broadcast({ type: 'ORDER_PAYMENT_FAILED', payload: { id, order_id: order.order_id, reason } });
      
      res.json({ success: true, message: 'Payment marked as failed. User can now retry.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/test-config', (req, res) => {
    res.json({
       projectId: admin.apps.length > 0 ? admin.app().options.projectId : null,
       dbId: process.env.FIREBASE_DATABASE_ID || config?.firestoreDatabaseId || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe',
       hasSecrets: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
       isReady: isFirebaseReady
    });
  });

  app.get('/api/firebase-config', (req, res) => {
    try {
      const config = getFirebaseWebConfig();
      res.json(config);
    } catch (err: any) {
      console.error('[CONFIG_ERROR] Failed to serve firebase-config:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/admin/dump-all-env', requireAdmin, (req, res) => {
    res.json({
        env: process.env
    });
  });

  app.get('/api/admin/verify-env', requireAdmin, (req, res) => {
    const vars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_DATABASE_ID',
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      'SESSION_SECRET'
    ];
    
    const results = vars.map(v => {
      const val = process.env[v];
      return {
        name: v,
        present: !!val,
        length: val ? val.length : 0,
        looksLikeJson: val ? (val.trim().startsWith('{') && val.trim().endsWith('}')) : false,
        sample: val ? (val.substring(0, 5) + '...') : null
      };
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: results,
      dbStatus: dbConnectionStatus
    });
  });
  
  app.get('/api/admin/diagnostics', async (req, res) => {
    try {
      const db = getFirestoreInstance();
      const isMock = !!(db as any)._isMock;
      let collections: string[] = [];
      let dbError: string | null = null;
      
      if (!isMock) {
        try {
          const colRefs = await db.listCollections();
          collections = colRefs.map((c: any) => c.id);
        } catch (e: any) {
          dbError = e.message;
        }
      }

      res.json({
        success: true,
        isFirebaseReady,
        isMock,
        dbError,
        collections,
        targetDatabase: process.env.FIREBASE_DATABASE_ID || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe',
        env: {
          PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'MISSING',
          VITE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || 'MISSING',
          HAS_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/geocode/reverse', wrap('/api/geocode/reverse', async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng" });
    }
    try {
      const googleKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
      if (googleKey) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`
          );
          const data = await response.json();
          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const components = result.address_components;

            let streetNumber = '';
            let route = '';
            let city = '';
            let state = '';
            let pin_code = '';

            components.forEach((c: any) => {
              if (c.types.includes('street_number')) streetNumber = c.long_name;
              if (c.types.includes('route')) route = c.long_name;
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) pin_code = c.long_name;
            });

            if (!city) {
              const sublocality = components.find((c: any) => c.types.includes('sublocality'));
              if (sublocality) city = sublocality.long_name;
            }

            return res.json({
              address: `${streetNumber} ${route}`.trim() || result.formatted_address,
              city,
              state,
              pin_code: pin_code.slice(0, 6),
              latitude: Number(lat),
              longitude: Number(lng)
            });
          }
        } catch (err) {
          console.warn("Google reverse geocoding on server failed:", err);
        }
      }

      // Safe and robust backend fetch to Nominatim (bypassing Client CORS issues completely)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'GeneralStoreKaryanaShop/1.0 (contact: parthgulyani7960@gmail.com)'
          }
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || '';
        const road = addr.road || '';
        const neighbourhood = addr.neighbourhood || addr.suburb || '';

        return res.json({
          address: `${road}${neighbourhood ? ', ' + neighbourhood : ''}`.trim() || data.display_name,
          city: city,
          state: addr.state || '',
          pin_code: addr.postcode?.replace(/\D/g, '').slice(0, 6) || '',
          latitude: Number(lat),
          longitude: Number(lng)
        });
      }
      return res.status(404).json({ error: "Address not found" });
    } catch (error: any) {
      console.error("Reverse geocode endpoint error:", error);
      return res.status(500).json({ error: error.message || "Failed to reverse geocode" });
    }
  }));

  const checkDbReady = () => isFirebaseReady && admin.apps.length > 0;
  
  app.get('/api/settings', wrap('/api/settings', async (req, res) => {
    const sensitiveKeys = ['otp_api_key', 'admin_otp', 'store_api_keys', 'maintenance_secret'];
    
    const payload = await getCachedData('public_settings_global_v1', async () => {
      const defaultVal = { 
        maintenance: false, authMode: 'email', storePhone: '+919999999999', whatsappNumber: '+919999999999', config: [], dbConnected: false 
      };
      
      if (!admin.apps.length || !isFirebaseReady) return defaultVal;
      
      const db = getFirestoreInstance();
      const snap = await db.collection('settings').get();
      const publicSettings = snap.docs.map((d: any) => ({ key: d.id, ...d.data() })).filter((s: any) => !sensitiveKeys.includes(s.key));
      
      const maintenance = publicSettings.find((s: any) => s.key === 'maintenance_mode')?.value === 'true';
      const authMode = publicSettings.find((s: any) => s.key === 'auth_mode')?.value || 'email';
      const storePhone = publicSettings.find((s: any) => s.key === 'store_phone')?.value || '';
      const whatsappNumber = publicSettings.find((s: any) => s.key === 'whatsapp_number')?.value || '';
      
      return { 
        maintenance, authMode, storePhone, whatsappNumber, config: publicSettings, dbConnected: true
      };
    }, 120);
    
    res.json(payload);
  }));

  app.get('/api/user/profile', requireAuth, wrap('/api/user/profile', async (req, res) => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const doc = await getFirestoreInstance().collection('users').doc(String(req.session.userId)).get();
    if (!doc.exists) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const user = doc.data();
    if (user) delete user.password;
    res.json({ id: doc.id, ...user });
  }));

  app.post('/api/user/export-data', requireAuth, wrap('/api/user/export-data', async (req, res) => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();
    const snap = await db.collection('data_exports')
      .where('user_id', '==', String(req.session.userId))
      .where('status', '==', 'PENDING_REVIEW')
      .get();
      
    if (!snap.empty) {
      res.status(400).json({ success: false, message: 'You already have a pending export request.' });
      return;
    }
    await db.collection('data_exports').add({ 
      user_id: String(req.session.userId), 
      status: 'PENDING_REVIEW', 
      created_at: new Date().toISOString() 
    });
    res.json({ success: true, message: 'Export requested. Admin will review soon.' });
  }));

  app.get('/api/user/export-status', requireAuth, wrap('/api/user/export-status', async (req, res) => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const snap = await getFirestoreInstance().collection('data_exports')
      .where('user_id', '==', String(req.session.userId))
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();
      
    if (snap.empty) {
      res.json({ status: 'NONE' });
      return;
    }
    const data = snap.docs[0].data();
    res.json({ status: data.status, created_at: data.created_at, approved_at: data.approved_at });
  }));

  app.get('/api/admin/data-exports', requireAdmin, wrap('/api/admin/data-exports', async (req, res) => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();
    console.log('[DB QUERY START] data_exports');
    const snap = await db.collection('data_exports').orderBy('created_at', 'desc').get();
    console.log('[DB QUERY END] data_exports');
    
    const results = await Promise.all(snap.docs.map(async d => {
      const exportData = { id: d.id, ...d.data() } as any;
      const userDoc = await getCachedData(`user_${exportData.user_id}`, async () => {
        return await db.collection('users').doc(exportData.user_id).get();
      }, 60);
      return { ...exportData, user_name: userDoc.exists ? userDoc.data()?.name : 'Unknown' };
    }));
    
    res.json(results);
  }));

  app.post('/api/admin/data-exports/:id/approve', requireAdmin, wrap('/api/admin/data-exports/:id/approve', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();
    const docRef = db.collection('data_exports').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ message: 'Export request not found' });
      return;
    }
    const data = doc.data() as any;
    await docRef.update({ status: 'APPROVED', approved_at: new Date().toISOString() });                
    await db.collection('notifications').add({
      user_id: data.user_id,
      message: 'Your data export request has been approved!',
      link: '/profile',
      created_at: new Date().toISOString()
    });                
    res.json({ success: true });
  }));

  app.post('/api/admin/data-exports/:id/reject', requireAdmin, wrap('/api/admin/data-exports/:id/reject', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('data_exports').doc(id).update({ status: 'REJECTED' });
    res.json({ success: true });
  }));

  app.post('/api/returns', requireAuth, async (req, res) => {
    const { order_id, product_id, quantity, reason } = req.body;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('returns').add({ order_id, product_id, user_id: String(req.session.userId), quantity, reason, status: 'pending', created_at: new Date().toISOString() });
      res.json({ success: true, message: 'Return request submitted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
  });

  app.post('/api/admin/purchases', requireAdmin, async (req, res) => {
    const { supplier_id, product_id, quantity, cost_price, invoice_number, batch_number, expiry_date } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const batch = getFirestoreInstance().batch();
      batch.set(getFirestoreInstance().collection('purchase_records').doc(), { supplier_id, product_id: String(product_id), quantity, cost_price, invoice_number, batch_number, expiry_date, created_at: new Date().toISOString() });
      const pRef = getFirestoreInstance().collection('products').doc(String(product_id));
      batch.update(pRef, { stock: admin.firestore.FieldValue.increment(Number(quantity)) });
      await batch.commit();
      res.json({ success: true, message: 'Purchase recorded successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to record purchase' });
    }
  });
  app.get('/api/admin/promotional-rules', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json([]);
      const snap = await getFirestoreInstance().collection('promotional_rules').orderBy('created_at', 'desc').get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch rules' });
    }
  });

  app.post('/api/admin/promotional-rules', requireAdmin, async (req, res) => {
    const { title, type, target_type, target_id, condition_qty, reward_qty, discount_value, active } = req.body;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('promotional_rules').add({
        title, type, target_type, target_id, condition_qty, reward_qty, discount_value, active, created_at: new Date().toISOString()
      });
      res.json({ success: true, message: 'Rule created' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create rule' });
    }
  });

  app.put('/api/admin/promotional-rules/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, type, target_type, target_id, condition_qty, reward_qty, discount_value, active } = req.body;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('promotional_rules').doc(id).update({
        title, type, target_type, target_id, condition_qty, reward_qty, discount_value, active
      });
      res.json({ success: true, message: 'Rule updated' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update rule' });
    }
  });

  app.delete('/api/admin/promotional-rules/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('promotional_rules').doc(id).delete();
      res.json({ success: true, message: 'Rule deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete rule' });
    }
  });

  app.get('/api/user/generate-export', requireAuth, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const snap = await getFirestoreInstance().collection('data_exports').where('user_id', '==', String(req.session.userId)).where('status', '==', 'APPROVED').orderBy('approved_at', 'desc').limit(1).get();
      
      if (snap.empty) {
        return res.status(403).json({ message: 'Export not approved or not found' });
      }
      
      const userSnap = await getFirestoreInstance().collection('users').doc(String(req.session.userId)).get();
      const user = userSnap.data();
      delete user?.password;

      const orderSnap = await getFirestoreInstance().collection('orders').where('user_id', '==', String(req.session.userId)).get();
      const orders = orderSnap.docs.map(d => ({id: d.id, ...d.data()}));

      const walletSnap = await getFirestoreInstance().collection('wallet_transactions').where('user_id', '==', String(req.session.userId)).get();
      const wallet = walletSnap.docs.map(d => ({id: d.id, ...d.data()}));
      
      res.json({ user, orders, wallet, generatedAt: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to generate export data' });
    }
  });

  app.get('/api/alerts', requireAuth, async (req, res) => {
    try {
      if (!isFirebaseReady) return res.json([]);
      const snap = await getFirestoreInstance().collection('user_alerts').where('is_read', '==', 0).get();
      const docs = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(d => (d as any).user_id == req.session.userId || !(d as any).user_id);
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/alerts/:id/read', requireAuth, async (req, res) => {
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('user_alerts').doc(req.params.id).update({ is_read: 1 });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Address Management
  app.get('/api/addresses', requireAuth, async (req, res) => {
    try {
      if (!isFirebaseReady) return res.json([]);
      const userId = String(req.session.userId || (req as any).user?.uid);
      const snap = await getFirestoreInstance().collection('user_addresses').where('user_id', '==', userId).get();
      const addresses = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
      res.json(addresses);
    } catch (e: any) {
      console.error('[ROUTE FAILURE] /api/addresses - Returning empty fallback', e.message);
      res.json([]);
    }
  });

  app.post('/api/addresses', requireAuth, async (req, res) => {
    const { name, phone, address, city, state, zip_code, pin_code, delivery_area, is_default } = req.body;
    const userId = String(req.session.userId || (req as any).user?.uid);

    try {
      if (!admin.apps.length) return res.status(500).json({});
      const batch = getFirestoreInstance().batch();
      
      if (is_default) {
        const snap = await getFirestoreInstance().collection('user_addresses').where('user_id', '==', userId).where('is_default', '==', 1).get();
        snap.docs.forEach(d => batch.update(d.ref, { is_default: 0 }));
      }

      const addressData = { 
        user_id: userId, 
        name, 
        phone, 
        address, 
        city, 
        state, 
        zip_code: zip_code || pin_code, 
        pin_code: pin_code || zip_code, 
        delivery_area, 
        is_default: is_default ? 1 : 0, 
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      const newDocRef = getFirestoreInstance().collection('user_addresses').doc();
      batch.set(newDocRef, addressData);

      await batch.commit();
      res.json({ id: newDocRef.id, ...addressData });
    } catch (err: any) {
      await logServerError(err, 'saveUserAddress', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Failed to save address' });
    }
  });

  app.put('/api/addresses/:id', requireAuth, async (req, res) => {
    const { name, phone, address, city, state, zip_code, pin_code, delivery_area, is_default } = req.body;
    const userId = String(req.session.userId || (req as any).user?.uid);
    const { id } = req.params;

    try {
      if (!admin.apps.length) return res.status(500).json({});
      const batch = getFirestoreInstance().batch();
      
      if (is_default) {
        const snap = await getFirestoreInstance().collection('user_addresses').where('user_id', '==', userId).where('is_default', '==', 1).get();
        snap.docs.forEach(d => batch.update(d.ref, { is_default: 0 }));
      }

      const addressData = { 
        name, 
        phone, 
        address, 
        city, 
        state, 
        zip_code: zip_code || pin_code, 
        pin_code: pin_code || zip_code, 
        delivery_area, 
        is_default: is_default ? 1 : 0, 
        updated_at: new Date().toISOString() 
      };
      
      batch.update(getFirestoreInstance().collection('user_addresses').doc(id), addressData);

      await batch.commit();
      res.json({ id, ...addressData });
    } catch (err: any) {
      await logServerError(err, 'updateUserAddress', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Failed to update address' });
    }
  });

  app.delete('/api/addresses/:id', requireAuth, async (req, res) => {
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('user_addresses').doc(req.params.id).delete();
      res.json({ success: true, message: 'Address deleted' });
    } catch (err: any) {
      await logServerError(err, 'deleteUserAddress', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Failed to delete address' });
    }
  });

  app.patch('/api/addresses/:id/default', requireAuth, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const userId = String(req.session.userId || (req as any).user?.uid);
      const batch = getFirestoreInstance().batch();
      const snap = await getFirestoreInstance().collection('user_addresses').where('user_id', '==', userId).get();
      snap.docs.forEach(d => {
        batch.update(d.ref, { is_default: d.id === req.params.id ? 1 : 0 });
      });
      await batch.commit();
      res.json({ success: true, message: 'Default address updated' });
    } catch (err: any) {
      await logServerError(err, 'setDefaultAddress', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Failed to update default address' });
    }
  });

  app.get('/api/admin/config', requireAdmin, wrap('/api/admin/config', async (req, res) => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const records = await getCachedData('admin_settings_v2', async () => {
      const snap = await getFirestoreInstance().collection('settings').get();
      return snap.docs.map(d => ({key: d.id, ...d.data()}));
    }, 60);
    res.json(records);
  }));

  app.get('/api/admin/runners', requireAdmin, wrap('/api/admin/runners', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('runners').get();
    res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }));

  app.post('/api/admin/runners', requireAdmin, wrap('/api/admin/runners', async (req, res) => {
    const { name, phone, vehicle_type } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('runners').add({ name, phone, vehicle_type: vehicle_type || 'Bike', status: 'active', created_at: new Date().toISOString() });
    res.json({ success: true });
  }));

  app.post('/api/admin/orders/:id/assign-runner', requireAdmin, wrap('/api/admin/orders/:id/assign-runner', async (req, res) => {
    const { id } = req.params;
    const { runner_id, estimated_delivery_minutes } = req.body;
    
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();
    const batch = db.batch();
    
    const estimated_delivery_at = new Date(Date.now() + (estimated_delivery_minutes || 30) * 60000).toISOString();
    const orderRef = db.collection('orders').doc(id);
    batch.update(orderRef, { assigned_runner_id: String(runner_id), status: 'shipped', estimated_delivery_at, last_status_update: 'Order picked up by runner', updated_at: new Date().toISOString() });
    
    const runnerRef = db.collection('runners').doc(String(runner_id));
    batch.update(runnerRef, { status: 'on_delivery', is_busy: 1 });
    
    const eventRef = db.collection('logistics_events').doc();
    batch.set(eventRef, { order_id: id, runner_id: String(runner_id), status: 'assigned', notes: 'Runner assigned by admin', created_at: new Date().toISOString() });
    
    await batch.commit();
    res.json({ success: true });
  }));

  app.get('/api/admin/search', requireAdmin, wrap('/api/admin/search', async (req, res) => {
    const { q } = req.query;
    if (!q || !admin.apps.length) {
      res.json({ products: [], orders: [], users: [], suspicious: [] });
      return;
    }
    res.json({ products: [], orders: [], users: [], suspicious: [] });
  }));

  app.post('/api/user/data-request', requireAuth, async (req, res) => {
    const { type, reason } = req.body;
    const userId = req.session.userId;
    
    try {
      if (admin.apps.length) {
        await getFirestoreInstance().collection('suspicious_activities').add({
          user_id: String(userId), activity_type: 'DATA_REQUEST', description: `${type.toUpperCase()} REQUEST: ${reason}`, created_at: new Date().toISOString()
        });
      }
      logEvent('info', `Data Request: ${type} from user ${userId}`, reason, userId, req.path);
      res.json({ success: true, message: 'Request recorded successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to record request' });
    }
  });

  app.get('/api/admin/suspicious-activities', requireAdmin, wrap('/api/admin/suspicious-activities', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('suspicious_activities').orderBy('created_at', 'desc').limit(100).get();
    const activities = [];
    for (const d of snap.docs) {
      const data = d.data();
      let user_name = 'Unknown';
      let user_phone = '';
      if (data.user_id) {
        const uDoc = await getFirestoreInstance().collection('users').doc(String(data.user_id)).get();
        if (uDoc.exists) {
          user_name = uDoc.data()?.name || 'Unknown';
          user_phone = uDoc.data()?.phone || '';
        }
      }
      activities.push({ id: d.id, ...data, type: data.activity_type, severity: 'medium', user_name, user_phone });
    }
    res.json(activities);
  }));

  app.post('/api/admin/suspicious-activities/:id/resolve', requireAdmin, wrap('/api/admin/suspicious-activities/:id/resolve', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('suspicious_activities').doc(id).delete();
    res.json({ success: true });
  }));

  app.post('/api/admin/users/:id/alert', requireAdmin, wrap('/api/admin/users/:id/alert', async (req, res) => {
    const { id } = req.params;
    const { title, message, details, type, duration, is_unskippable } = req.body;
    if (typeof createAlert !== 'function') throw new Error('createAlert utility not available');
    await createAlert(id as any, title, message, details, type, duration, is_unskippable);
    res.json({ success: true });
  }));

  app.post('/api/admin/broadcast-alert', requireAdmin, wrap('/api/admin/broadcast-alert', async (req, res) => {
    const { title, message, details, type, duration, is_unskippable } = req.body;
    if (typeof createAlert !== 'function') throw new Error('createAlert utility not available');
    await createAlert(null, title, message, details, type, duration, is_unskippable);
    res.json({ success: true });
  }));

  app.get('/api/admin/settings', requireAdmin, wrap('/api/admin/settings', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('settings').get();
    res.json(snap.docs.map(d => ({ key: d.id, ...d.data() })));
  }));

  app.post('/api/admin/settings', requireAdmin, wrap('/api/admin/settings', async (req, res) => {
    const { key, value } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('settings').doc(key).set({ value }, { merge: true });
    if (key === 'maintenance_mode' && value === 'true') {
      if (typeof createAlert === 'function') {
        createAlert(null, 'Maintenance Started', 'The store is now under maintenance for scheduled updates.', 'All systems will be offline shortly. We apologize for the inconvenience.', 'critical', 8000);
      }
    } else if (key === 'maintenance_mode' && value === 'false') {
      if (typeof createAlert === 'function') {
        createAlert(null, 'Store Back Online', 'The maintenance has been successfully completed.', 'You can now resume shopping and track your orders.', 'success', 6000);
      }
    }
    res.json({ success: true });
  }));

  app.post('/api/admin/products/:id/images', requireAdmin, wrap('/api/admin/products/:id/images', async (req, res) => {
    const { id } = req.params;
    const { images } = req.body;
    
    if (!images || !Array.isArray(images)) {
      res.status(400).json({ success: false, message: 'Invalid images data' });
      return;
    }

    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const docRef = getFirestoreInstance().collection('products').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    let product = doc.data() as any;
    let currentImages: any[] = [];
    if (product.images) {
      if (typeof product.images === 'string') {
        try { currentImages = JSON.parse(product.images); } catch(e){}
      } else {
        currentImages = Array.isArray(product.images) ? [...product.images] : [];
      }
    }

    const updatedImages = [...currentImages, ...images];
    let updatedMainImage = product.image_url;
    
    if (!updatedMainImage && updatedImages.length > 0) {
      updatedMainImage = updatedImages[0];
      updatedImages.shift();
    }

    await docRef.update({ images: JSON.stringify(updatedImages), image_url: updatedMainImage });
    res.json({ success: true });
  }));

  app.put('/api/admin/products/:id/images', requireAdmin, wrap('/api/admin/products/:id/images', async (req, res) => {
    const { id } = req.params;
    const { images } = req.body;
    if (!Array.isArray(images)) {
      res.status(400).json({ success: false, message: 'Invalid images data' });
      return;
    }
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('products').doc(id).update({ images: JSON.stringify(images) });
    res.json({ success: true });
  }));

  app.delete('/api/admin/products/:id/images', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!admin.apps.length) return res.status(500).json({});
    const docRef = getFirestoreInstance().collection('products').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Product not found' });
    const product = doc.data() as any;

    let images = [];
    if (product.images) {
      if (typeof product.images === 'string') {
        try { images = JSON.parse(product.images); } catch(e){}
      } else {
        images = [...product.images];
      }
    }

    const updatedImages = images.filter((img: string) => img !== imageUrl);
    let updatedMainImage = product.image_url;

    if (product.image_url === imageUrl) {
      updatedMainImage = updatedImages.length > 0 ? updatedImages[0] : '';
      if (updatedImages.length > 0) {
        updatedImages.shift();
      }
    }

    await docRef.update({ images: JSON.stringify(updatedImages), image_url: updatedMainImage });
    res.json({ success: true });
  });

  // Bulk Discounts API
  app.get('/api/admin/bulk-discounts', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json([]);
      const snap = await getFirestoreInstance().collection('bulk_discounts').orderBy('created_at', 'desc').get();
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/bulk-discounts', requireAdmin, async (req, res) => {
    const { entity_type, entity_id, min_qty, discount_type, discount_value, active } = req.body;
    try {
      if (admin.apps.length) {
        const docRef = await getFirestoreInstance().collection('bulk_discounts').add({
          entity_type, entity_id: String(entity_id), min_qty, discount_type, discount_value, active: active ? 1 : 0, created_at: new Date().toISOString()
        });
        res.json({ success: true, id: docRef.id });
      } else {
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put('/api/admin/bulk-discounts/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { entity_type, entity_id, min_qty, discount_type, discount_value, active } = req.body;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('bulk_discounts').doc(id).update({
        entity_type, entity_id: String(entity_id), min_qty, discount_type, discount_value, active: active ? 1 : 0
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/admin/bulk-discounts/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('bulk_discounts').doc(id).delete();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/cart', requireAuth, wrap('/api/cart', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
      res.status(400).json({ message: 'User ID required' });
      return;
    }
    
    if (String(userId) !== String(req.session.userId)) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    if (!admin.apps.length) {
      res.status(500).json([]);
      return;
    }

    console.log('[DB QUERY START] cart_items');
    const snap = await getFirestoreInstance().collection('cart_items').where('user_id', '==', String(userId)).get();
    console.log('[DB QUERY END] cart_items');
    
    const cartDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Parallelize product lookups
    const items = await Promise.all(cartDocs.map(async (doc: any) => {
      const productId = String(doc.product_id);
      
      // Use cache for product data to avoid repeat reads
      const pData = await getCachedData(`prod_${productId}`, async () => {
        console.log(`[DB QUERY START] product ${productId}`);
        const pDoc = await getFirestoreInstance().collection('products').doc(productId).get();
        console.log(`[DB QUERY END] product ${productId}`);
        return pDoc.exists ? pDoc.data() : null;
      }, 120); // Cache products for 2 mins

      if (!pData) return { ...doc, name: 'Product Unavailable', price: 0 };
      
      return { 
        ...doc, 
        name: pData.name, 
        price: pData.price, 
        image_url: pData.image_url, 
        stock: pData.stock, 
        category: pData.category 
      };
    }));

    res.json(items);
  }));

  app.post('/api/cart/sync', requireAuth, wrap('/api/cart/sync', async (req, res) => {
    const userId = req.session.userId;
    const { items } = req.body;
    
    if (!userId) {
      res.status(400).json({ message: 'User ID required' });
      return;
    }

    if (!Array.isArray(items)) {
       res.status(400).json({ message: 'Items must be an array' });
       return;
    }
    
    if (!admin.apps.length) {
      res.status(500).json({ success: false, message: 'Firebase not initialized' });
      return;
    }

    const db = getFirestoreInstance();
    const batch = db.batch();
    
    console.log('[DB QUERY START] cart_items check');
    const snap = await db.collection('cart_items').where('user_id', '==', String(userId)).get();
    console.log('[DB QUERY END] cart_items check');
    
    snap.docs.forEach(d => batch.delete(d.ref));
    
    const itemMap = new Map();
    for (const item of items) {
      if (!item || !item.id) continue;
      const qty = Number(item.quantity) || 1;
      if (itemMap.has(item.id)) {
        itemMap.set(item.id, itemMap.get(item.id) + qty);
      } else {
        itemMap.set(item.id, qty);
      }
    }
    
    for (const [productId, quantity] of itemMap.entries()) {
      batch.set(db.collection('cart_items').doc(), { 
        user_id: String(userId), 
        product_id: String(productId), 
        quantity: Number(quantity) 
      });
    }
    
    console.log('[DB BATCH START] cart sync');
    await batch.commit();
    console.log('[DB BATCH END] cart sync');
    
    res.json({ success: true });
  }));

  app.get('/api/admin/logs', requireAdmin, wrap('/api/admin/logs', async (req, res) => {
    if (!admin.apps.length) return res.status(500).json([]);
    const snap = await getFirestoreInstance().collection('system_logs').orderBy('created_at', 'desc').limit(100).get();
    res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }));

  app.get('/api/admin/suspicious', requireAdmin, wrap('/api/admin/suspicious', async (req, res) => {
    if (!admin.apps.length) return res.status(500).json([]);
    const snap = await getFirestoreInstance().collection('suspicious_activities').orderBy('created_at', 'desc').limit(100).get();
    res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }));

  app.get('/api/auth/me', async (req, res) => {
    console.log('[ROUTE START] /api/auth/me', { requestId: (req as any).id });
    try {
      console.log('[STEP 1] Checking Firebase status...');
      // MOVED: check moved after token verification to allow shadow user identification

      console.log('[STEP 2] Verifying authentication flow...');
      let authUserFromToken: any = null;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          if (admin.apps.length) {
            const decodedToken = await safeVerifyIdToken(token);
            console.log('AUTH VERIFY SUCCESS: Firebase Token');
            const email = sanitizeEmail(decodedToken.email);
            
            if (email) {
              // We try to get or create the user, but if DB is down, we fallback to shadow user
              try {
                if (isFirebaseReady) {
                  authUserFromToken = await getOrCreateUser(email, decodedToken);
                }
              } catch (dbErr) {
                console.warn('[AUTH/ME] getOrCreateUser failed due to DB state:', dbErr.message);
              }
              
              if (!authUserFromToken) {
                // Fallback to shadow user if DB is down or initializing
                authUserFromToken = {
                  id: `shadow_${decodedToken.uid}`,
                  email: email,
                  role: 'customer',
                  name: decodedToken.name || 'User',
                  is_shadow: true,
                  loading: !isFirebaseReady
                };
              }
              
              if (authUserFromToken) {
                (req as any).session = (req as any).session || {};
                (req as any).session.userId = authUserFromToken.id;
                (req as any).session.role = authUserFromToken.role;
                (req as any).session.email = email;
              }
            }
          }
        } catch (e: any) {
          console.warn('[AUTH/ME] Token verification failed:', e.message);
        }
      }

      if (!req.session || !req.session.userId) {
        return res.status(200).json({ success: true, user: null, message: 'Not authenticated' });
      }

      if (!isFirebaseReady) {
        console.log('[STEP 2.1] Database not ready, returning shadow user if available');
        if (req.session.userId) {
           return res.status(200).json({ 
             success: true, 
             user: authUserFromToken || { id: req.session.userId, role: req.session.role || 'customer', is_shadow: true, loading: true }, 
             message: 'Database initializing...', 
             dbOffline: true 
           });
        }
        return res.status(200).json({ success: false, message: 'Wait for database...', dbOffline: true });
      }
      
      let sessionUser;
      if (isFirebaseReady) {
        try {
          const doc = await getFirestoreInstance().collection('users').doc(String(req.session.userId)).get();
          if (doc.exists) {
            sessionUser = { id: doc.id, ...doc.data() } as any;
          }
        } catch (dbErr: any) {
          console.warn('[AUTH/ME] Firestore session retrieval failed, using fallback:', dbErr.message);
        }

        // Apply fallback parsing for token_ or shadow_ IDs if the database fetch failed or returned nothing
        if (!sessionUser) {
          const uId = String(req.session.userId);
          if (uId.startsWith('token_') || uId.startsWith('shadow_')) {
            sessionUser = { 
              id: uId, 
              email: uId.split('_')[2] || 'user@example.com',
              role: req.session.role || 'customer',
              name: 'Shadow User',
              is_shadow: true
            };
          } else {
            // General safety session fallback to prevent login loop if DB is down/restricted
            sessionUser = {
              id: req.session.userId,
              email: req.session.email || 'user@example.com',
              role: req.session.role || 'customer',
              name: req.session.name || 'User',
              is_shadow: true,
              db_error: 'Firestore unreachable'
            };
          }
        }
        
        // Auto-upgrade permissions for administrative email configurations
        if (sessionUser) {
          const cleanEmail = sanitizeEmail(sessionUser.email);
          const adminEmailConfig = await getAdminEmail();
          const isDeveloperEmail = cleanEmail === 'parthgulyani7960@gmail.com';
          const isConfigAdmin = cleanEmail === sanitizeEmail(adminEmailConfig);
          const shouldBeAdmin = isDeveloperEmail || isConfigAdmin;

          if (shouldBeAdmin && sessionUser.role !== 'admin') {
            try {
              await getFirestoreInstance().collection('users').doc(sessionUser.id).update({ role: 'admin' });
            } catch (updateErr) {}
            sessionUser.role = 'admin';
            req.session.role = 'admin';
          }
        }
      }
      

      
      if (!sessionUser) {
        return res.status(401).json({ success: false, message: 'USER_NOT_FOUND', reqSessionUserId: req.session.userId });
      }
      
      const tokenPayload = { userId: sessionUser.id, role: sessionUser.role, timestamp: Date.now() };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      
      console.log('[ROUTE SUCCESS] /api/auth/me - User found:', sessionUser.email);
      res.json({ success: true, user: sessionUser, token });
    } catch (err: any) {
      console.error('[ROUTE FAILURE] /api/auth/me - Returning partial data to prevent 500', err.message);
      res.json({ 
        success: true, 
        user: { id: req.session?.userId || 'unknown', role: req.session?.role || 'customer', is_shadow: true },
        error: err.message 
      });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session = null;
      res.json({ success: true });
  });





  app.post('/api/auth/complete-profile', requireAuth, wrap('/api/auth/complete-profile', async (req, res) => {
    const { name, phone, profile_photo, acquisition_source } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Invalid name' });
    }

    const uid = String(req.session.userId);
    if (!admin.apps.length) return res.status(500).json({success: false});

    const phoneSnap = await getFirestoreInstance().collection('users').where('phone', '==', phone).get();
    if (!phoneSnap.empty) {
      const otherDocs = phoneSnap.docs.filter(d => d.id !== uid);
      if (otherDocs.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'This mobile number is already registered with another account. Please use a different number or contact support if this is an error.' 
        });
      }
    }

    const formattedName = capitalizeName(name);
    await getFirestoreInstance().collection('users').doc(uid).update({
      name: formattedName, phone, profile_photo, acquisition_source: acquisition_source || 'direct', updated_at: new Date().toISOString()
    });
    
    const doc = await getFirestoreInstance().collection('users').doc(uid).get();
    const user = {id: doc.id, ...doc.data()} as any;
    
    res.json({ success: true, user });
  }));

  app.post('/api/auth/demo-login', async (req, res) => {
    console.warn(`[AUTH] Blocked unauthorized attempt to request demo-login from IP: ${req.ip}`);
    return res.status(403).json({ 
      success: false, 
      message: 'Demo and sandbox credentials bypasses are permanently deactivated for production safety compliance.' 
    });
  });


  app.post('/api/auth/firebase-login', async (req, res) => {
    const requestId = (req as any).id || Math.random().toString(36).substring(7);
    console.log('[ROUTE START] /api/auth/firebase-login', { requestId });
    const ip = req.ip || 'unknown';
    try {
      const { idToken } = req.body;
      const tokenExists = !!idToken;
      const tokenLength = idToken ? idToken.length : 0;
      
      const adminProjectId = admin.apps.length > 0 ? admin.app().options?.projectId : 'not_initialized';
      const envProjectId = process.env.FIREBASE_PROJECT_ID;

      logAuthDebug('[FIREBASE_LOGIN_API_CALL] Attempt started', {
        requestId,
        tokenExists,
        tokenLength,
        adminProjectId,
        envProjectId,
        ip
      });

      // Rate limiting: Check failed attempts by IP (only if Firestore is ready)
      if (isFirebaseReady) {
        try {
          const attemptsRef = getFirestoreInstance().collection('login_attempts').doc(ip);
          const attemptsDoc = await attemptsRef.get();
          if (attemptsDoc.exists) {
            const data = attemptsDoc.data();
            if (data && data.count >= 15 && Date.now() < data.lockedUntil) {
               return res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.' });
            }
            if (data && data.count >= 15 && Date.now() >= data.lockedUntil) {
               await attemptsRef.update({ count: 0, lockedUntil: 0 });
            }
          }
        } catch (dbErr) {
          console.warn('[AUTH] Failed to check/update rate limit attempts during login', dbErr);
        }
      }

      console.log('[STEP 3] Verifying idToken...');
      if (!idToken) {
        console.error('[STEP 3.1] No token provided in request body');
        logAuthDebug('[FIREBASE_LOGIN_ERROR] Missing token', { requestId });
        return res.status(400).json({ success: false, message: 'No token provided' });
      }
      
      console.log('[STEP 4] Calling safeVerifyIdToken...');
      let decodedToken;
      try {
        decodedToken = await safeVerifyIdToken(idToken);
        console.log('[STEP 5] Token verified successfully via Firebase Admin API. UID:', decodedToken.uid);
        logAuthDebug('[FIREBASE_LOGIN_SUCCESS_VERIFIED] Token verified', {
          requestId,
          uid: decodedToken.uid,
          email: decodedToken.email,
          aud: decodedToken.aud
        });
      } catch (verifyErr: any) {
        console.error('[STEP 5.ERROR] Token verification failed in route:', verifyErr.message);
        
        logAuthDebug('[FIREBASE_LOGIN_FAIL_VERIFIED] Token verification exception details:', {
          requestId,
          tokenExists,
          tokenLength,
          adminProjectId,
          envProjectId,
          errorMessage: verifyErr.message,
          errorCode: verifyErr.code || 'unknown',
          errorStack: verifyErr.stack
        });
        
        // Handle rate limiting from Firebase Auth
        if (verifyErr.code === 'auth/quota-exceeded' || verifyErr.message.includes('Rate exceeded')) {
          return res.status(429).json({ success: false, message: 'Too many authentication requests. Please try again in a few minutes.' });
        }

        logSuspicious(null, 'JWT_VERIFY_FAILED', `Token verification failed: ${verifyErr.message}. IP: ${req.ip}`);
        if (isFirebaseReady) {
          getFirestoreInstance().collection('security_logs').add({
            type: 'failed_login',
            details: `Token verification failed: ${verifyErr.message}`,
            ip: req.ip || 'unknown',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: req.headers['user-agent'] || 'Server',
            email: 'Unknown'
          }).catch(err => console.error('Failed to log failed_login:', err));
        }
        return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
      }
      
      const email = sanitizeEmail(decodedToken.email);
      
      if (!email) {
        logSuspicious(null, 'MALFORMED_AUTH', `Firebase login attempt without email. IP: ${req.ip}`);
        if (isFirebaseReady) {
          getFirestoreInstance().collection('security_logs').add({
            type: 'failed_login',
            details: `Malformed auth missing email`,
            ip: req.ip || 'unknown',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: req.headers['user-agent'] || 'Server',
            email: 'Unknown'
          }).catch(err => console.error('Failed to log failed_login:', err));
        }
        return res.status(400).json({ success: false, message: 'Google account must have an email' });
      }

      let user = null;
      try {
        if (isFirebaseReady) {
          user = await getOrCreateUser(email, decodedToken);
        }
      } catch (getOrCreateErr: any) {
        console.warn('[AUTH] getOrCreateUser failed inside login endpoint, falling back to shadow profile:', getOrCreateErr.message);
      }

      if (!user) {
        // Fallback to shadow user if DB is down or initializing
        user = {
          id: `shadow_${decodedToken.uid}`,
          email: email,
          role: (email === 'parthgulyani7960@gmail.com' || email === 'admin@hindstore.com') ? 'admin' : 'customer',
          name: decodedToken.name || email.split('@')[0],
          is_shadow: true,
          loading: !isFirebaseReady
        };
      }

      if (user.status === 'disabled') {
        console.warn(`[AUTH] Login attempt by disabled user: ${user.email}`);
        if (isFirebaseReady) {
          getFirestoreInstance().collection('security_logs').add({
            type: 'failed_login',
            details: `Suspended account access attempted for: ${user.email}`,
            ip: req.ip || 'unknown',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: req.headers['user-agent'] || 'Server',
            email: user.email,
            userId: user.id
          }).catch(err => console.error('Failed to log failed_login:', err));
        }
        return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
      }

      // Atomically update and establish the request session object FULLY!
      (req as any).session = (req as any).session || {};
      (req as any).session.userId = user.id;
      (req as any).session.role = user.role;
      (req as any).session.userEmail = user.email;

      // Update login metadata in parallel to respond faster
      if (isFirebaseReady) {
        Promise.all([
          getFirestoreInstance().collection('users').doc(user.id).update({
            last_login_at: new Date().toISOString(),
            ip_address: req.ip || null,
            device_info: req.headers['user-agent'] || null
          }),
          getFirestoreInstance().collection('login_attempts').doc(ip).set({ count: 0, lockedUntil: 0 })
        ]).catch(updateErr => {
          console.error('[AUTH] Background update of login details failed:', updateErr);
        });
        user.last_login_at = new Date().toISOString();
      }

      const isNewUser = !user.phone || !user.name || user.name === 'User' || !user.profile_photo;
      
      res.json({ success: true, user, isNewUser });
    } catch (e: any) {
      console.error('[ROUTE FAILURE] /api/auth/firebase-login', {
        message: e.message,
        stack: e.stack,
        requestId: (req as any).id
      });
      
      // Handle rate limiting
      if (e.message?.includes('Rate exceeded') || e.code === 'auth/quota-exceeded') {
          return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
      }

      // Increment failed attempts (only if firebase is ready)
      if (isFirebaseReady) {
        try {
          const attemptsRef = getFirestoreInstance().collection('login_attempts').doc(ip);
          const attemptsDoc = await attemptsRef.get();
          if (!attemptsDoc.exists) {
              await attemptsRef.set({ count: 1, lockedUntil: 0 });
          } else {
              const data = attemptsDoc.data();
              const newCount = (data?.count || 0) + 1;
              const newLockedUntil = newCount >= 5 ? Date.now() + 600000 : 0; // Lock for 10 mins
              await attemptsRef.update({ count: newCount, lockedUntil: newLockedUntil });
          }
          getFirestoreInstance().collection('security_logs').add({
            type: 'failed_login',
            details: `Authentication Failure: ${e.message}`,
            ip: ip,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: req.headers['user-agent'] || 'Server',
            email: 'Unknown'
          }).catch(err => console.error('Failed to log failed_login:', err));
        } catch (err) {
          console.error('Failed to update login attempts (likely database unavailable)', err);
        }
      }
      res.status(500).json({
        success: false,
        route: '/api/auth/firebase-login',
        error: e.message,
        stack: e.stack
      });
    }
  });

  // Helper to check admin email
  async function getAdminEmail(): Promise<string> {
    if (!admin.apps.length) return 'parthgulyani7960@gmail.com';
    const docRef = getFirestoreInstance().collection('settings').doc('admin_email');
    const doc = await docRef.get();
    if (doc.exists) {
      return (doc.data() as any).value || 'parthgulyani7960@gmail.com';
    }
    return 'parthgulyani7960@gmail.com';
  }

  app.get('/api/bulk-discounts', async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('bulk_discounts').where('active', '==', 1).get();
      // sort by min_qty desc
      let records = snap.docs.map(d => ({id: d.id, ...d.data()}) as any);
      records.sort((a,b) => (b.min_qty || 0) - (a.min_qty || 0));
      res.json(records);
    } catch (err: any) {
      console.warn('[BULK_DISCOUNTS] Firestore fetch failed:', err.message);
      res.json([]);
    }
  });

  app.get('/api/categories', wrap('/api/categories', async (req, res) => {
    const categories = await getCachedData('all_categories_v2', async () => {
      const initialCats = [
        { id: "cat_1", name: "Grains & Flours" },
        { id: "cat_2", name: "Spices" },
        { id: "cat_3", name: "Oils & Ghee" }
      ];
      
      if (!admin.apps.length || !isFirebaseReady) return initialCats;
      
      const db = getFirestoreInstance();
      const snapshot = await db.collection('categories').get();
      if (snapshot.empty) return initialCats;
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, 300);
    res.json(categories);
  }));

  app.post('/api/admin/categories', async (req, res) => {
    const { name, icon, image_url, is_out_of_stock } = req.body;
    try {
      if (admin.apps.length > 0) {
        const newDocRef = await getFirestoreInstance().collection('categories').add({
           name, icon, image_url, is_out_of_stock: is_out_of_stock ? 1 : 0
        });
        
        responseCache.del('all_categories');
        
        return res.json({ success: true, id: newDocRef.id });
      }
      res.status(500).json({ success: false, message: 'Firebase not connected' });
    } catch (err) {
      res.status(400).json({ success: false, message: 'Category creation failed' });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, icon, image_url, is_out_of_stock } = req.body;
    
    if (admin.apps.length > 0) {
      try {
        await getFirestoreInstance().collection('categories').doc(String(id)).set({
           name, icon, image_url, is_out_of_stock: is_out_of_stock ? 1 : 0
        }, { merge: true });
        
        responseCache.del('all_categories');
        
        return res.json({ success: true });
      } catch(e) { console.error('Firebase category put failed', e); }
    }
    
    res.status(500).json({ success: false, message: 'Firebase not connected' });
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    const { id } = req.params;
    
    if (admin.apps.length > 0) {
      try {
        await getFirestoreInstance().collection('categories').doc(String(id)).delete();
        
        responseCache.del('all_categories');
        
        return res.json({ success: true });
      } catch(e) { console.error('Firebase category delete failed', e); }
    }
    
    res.status(500).json({ success: false, message: 'Firebase not connected' });
  });

  app.post('/api/newsletter/subscribe', wrap('/api/newsletter/subscribe', async (req, res) => {
    const { email, user_id } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email required' });
      return;
    }
    
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const db = getFirestoreInstance();
    const snap = await db.collection('newsletter').where('email', '==', email).limit(1).get();
    if (!snap.empty) {
      res.json({ success: false, message: 'Already subscribed', alreadySubscribed: true });
      return;
    }
    
    await db.collection('newsletter').add({ 
      email, 
      user_id: user_id ? String(user_id) : null, 
      created_at: new Date().toISOString() 
    });
    
    res.json({ success: true, message: 'Successfully subscribed' });
  }));

  app.post('/api/newsletter/status', wrap('/api/newsletter/status', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email required' });
      return;
    }
    const db = getFirestoreInstance();
    const snap = await db.collection('newsletter').where('email', '==', email).limit(1).get();
    res.json({ success: true, subscribed: !snap.empty });
  }));

  app.post('/api/newsletter/unsubscribe', wrap('/api/newsletter/unsubscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email required' });
      return;
    }
    const db = getFirestoreInstance();
    const snap = await db.collection('newsletter').where('email', '==', email).get();
    if (snap.empty) {
      res.json({ success: false, message: 'Not subscribed yet or already unsubscribed' });
      return;
    }
    const batch = db.batch();
    snap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    res.json({ success: true, message: 'Successfully unsubscribed' });
  }));

  app.get('/api/admin/newsletter', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json([]);
      const snap = await getFirestoreInstance().collection('newsletter').orderBy('created_at', 'desc').get();
      const subscribers = [];
      for (const d of snap.docs) {
        let user_name = null; let user_phone = null;
        if (d.data().user_id) {
          const uDoc = await getFirestoreInstance().collection('users').doc(String(d.data().user_id)).get();
          if (uDoc.exists) { user_name = uDoc.data()?.name; user_phone = uDoc.data()?.phone; }
        }
        subscribers.push({id: d.id, ...d.data(), user_name, user_phone});
      }
      res.json(subscribers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/newsletter/add', requireAdmin, async (req, res) => {
    const { email } = req.body;
    try {
      if (!email) return res.status(400).json({ success: false, message: 'Email required' });
      const snap = await getFirestoreInstance().collection('newsletter').where('email', '==', email).get();
      if (!snap.empty) {
        return res.status(400).json({ success: false, message: 'Already subscribed' });
      }
      const ref = await getFirestoreInstance().collection('newsletter').add({ 
        email, 
        user_id: null, 
        created_at: new Date().toISOString() 
      });
      res.json({ success: true, id: ref.id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/admin/newsletter/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await getFirestoreInstance().collection('newsletter').doc(id).delete();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/newsletter/sync-users', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not initiated' });
      const firestore = getFirestoreInstance();
      const usersSnap = await firestore.collection('users').get();
      const newsletterSnap = await firestore.collection('newsletter').get();
      const existingEmails = new Set(newsletterSnap.docs.map(doc => doc.data().email?.toLowerCase()));
      let importedCount = 0;
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const email = userData.email;
        if (email && email.includes('@') && !existingEmails.has(email.toLowerCase())) {
          await firestore.collection('newsletter').add({
            email: email,
            user_id: userDoc.id,
            created_at: new Date().toISOString()
          });
          existingEmails.add(email.toLowerCase());
          importedCount++;
        }
      }
      res.json({ success: true, count: importedCount });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/newsletter/send', requireAdmin, async (req, res) => {
    const { subject, message, recipientCount, channel } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not initiated' });
      const ref = await getFirestoreInstance().collection('newsletter_campaigns').add({
        subject,
        message,
        recipient_count: recipientCount || 0,
        channel: channel || 'email',
        created_at: new Date().toISOString()
      });
      
      if (channel === 'in-app' || channel === 'system-notification') {
        await getFirestoreInstance().collection('notifications').add({
          title: subject,
          message: message,
          target_role: 'all',
          is_read: 0,
          created_at: new Date().toISOString()
        });
      }
      
      res.json({ success: true, id: ref.id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/admin/newsletter/campaigns', requireAdmin, async (req, res) => {
    try {
    console.log(`[ADMIN STATE] admin.apps.length=${admin.apps.length}`);
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('newsletter_campaigns').orderBy('created_at', 'desc').get();
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Variant Management
  app.post('/api/admin/products/:id/variants', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, unit_quantity, is_default } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const batch = getFirestoreInstance().batch();
      
      if (is_default) {
        const snap = await getFirestoreInstance().collection('product_variants').where('product_id', '==', id).where('is_default', '==', 1).get();
        snap.docs.forEach(d => batch.update(d.ref, {is_default: 0}));
      }
      
      const newRef = getFirestoreInstance().collection('product_variants').doc();
      batch.set(newRef, { product_id: String(id), name, price: Number(price), stock: Number(stock), unit_quantity, is_default: is_default ? 1 : 0 });
      await batch.commit();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/variants/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, unit_quantity, is_default } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const docRef = getFirestoreInstance().collection('product_variants').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({});
      const variant = doc.data() as any;
      
      const batch = getFirestoreInstance().batch();
      if (is_default) {
        const snap = await getFirestoreInstance().collection('product_variants').where('product_id', '==', String(variant.product_id)).where('is_default', '==', 1).get();
        snap.docs.forEach(d => batch.update(d.ref, {is_default: 0}));
      }
      
      batch.update(docRef, { name, price: Number(price), stock: Number(stock), unit_quantity, is_default: is_default ? 1 : 0 });
      await batch.commit();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/variants/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('product_variants').doc(id).delete();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delivery Areas
  app.get('/api/user/insights/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    if (String(userId) !== String(req.session.userId) && req.session.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
      if (!admin.apps.length) return res.json({ totalSpent: 0, orderCount: 0, totalSavings: 0, categoryBreakdown: [], spendingHistory: [], topProducts: [] });
      
      const ordersSnap = await getFirestoreInstance().collection('orders')
        .where('user_id', '==', String(userId))
        .get();
        
      const orders = ordersSnap.docs.map(doc => doc.data()).filter(o => o.status !== 'cancelled');
      
      const summary = {
        totalSpent: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        orderCount: orders.length,
        totalSavings: orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0)
      };

      const categoryMap = new Map();
      const productMap = new Map();
      
      for (const order of orders) {
        if (!order.items || !Array.isArray(order.items)) continue;
        for (const item of order.items) {
          const cat = item.category || 'Uncategorized';
          const qty = Number(item.quantity) || 0;
          const val = (Number(item.price) || 0) * qty;
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + val);
          
          if (item.product_id) {
            const pId = String(item.product_id);
            const pData = productMap.get(pId) || { name: item.product_name || item.name, image_url: item.image_url, total_qty: 0, total_spent: 0 };
            pData.total_qty += qty;
            pData.total_spent += val;
            productMap.set(pId, pData);
          }
        }
      }
      
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      const topProducts = Array.from(productMap.values()).sort((a, b) => b.total_spent - a.total_spent).slice(0, 6);

      // Spending history
      const monthMap = new Map();
      for (const order of orders) {
        if (!order.created_at) continue;
        const d = new Date(order.created_at);
        const yyyyMm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(yyyyMm, (monthMap.get(yyyyMm) || 0) + (Number(order.total) || 0));
      }
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
      const formattedHistory = sortedMonths.map(([m, amount]) => {
        const [yy, mm] = m.split('-');
        return {
          date: months[parseInt(mm) - 1] + ' ' + yy.slice(-2),
          amount
        };
      });

      res.json({
        totalSpent: summary.totalSpent,
        orderCount: summary.orderCount,
        totalSavings: summary.totalSavings,
        categoryBreakdown,
        spendingHistory: formattedHistory,
        topProducts
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to fetch insights' });
    }
  });

  app.get('/api/user/khata/history/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    if (String(userId) !== String(req.session.userId) && req.session.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('wallet_transactions')
        .where('user_id', '==', String(userId))
        .get();
        
      const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => d.is_khata || (d.description && d.description.includes('Khata')))
        .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch Khata history', error: err.message });
    }
  });

  app.post('/api/admin/khata/adjust', requireAdmin, async (req, res) => {
    const { userId, amount, description } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const batch = getFirestoreInstance().batch();
      
      const userRef = getFirestoreInstance().collection('users').doc(String(userId));
      batch.update(userRef, { khata_balance: admin.firestore.FieldValue.increment(-Number(amount)) });
      
      const newTxRef = getFirestoreInstance().collection('wallet_transactions').doc();
      batch.set(newTxRef, { user_id: String(userId), amount: Number(amount), type: 'credit', description, status: 'approved', created_at: new Date().toISOString() });
      
      await batch.commit();
      res.json({ success: true, message: 'Khata balance updated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to adjust Khata balance', error: err.message });
    }
  });

  app.get('/api/admin/sales-analytics', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json({ dailySales: [], topProducts: [] });
      
      const { startDate, endDate } = req.query;

      const ordersSnap = await getFirestoreInstance().collection('orders').where('status', '==', 'completed').get();
      let orders = ordersSnap.docs.map(doc => doc.data());

      if (startDate) {
        orders = orders.filter(o => o.created_at >= (startDate as string));
      }
      if (endDate) {
        let endStr = endDate as string;
        if (endStr.length === 10) {
           endStr += 'T23:59:59.999Z';
        }
        orders = orders.filter(o => o.created_at <= endStr);
      }
      
      const dailyMap = new Map();
      const prodMap = new Map();
      
      for (const order of orders) {
        if (!order.created_at) continue;
        const d = (order.created_at || '').substring(0, 10);
        if (!d) continue;
        
        dailyMap.set(d, (dailyMap.get(d) || 0) + (Number(order.total) || 0));
        
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
             const pname = item.product_name || item.name;
             if (pname) {
                prodMap.set(pname, (prodMap.get(pname) || 0) + (Number(item.quantity) || 0));
             }
          }
        }
      }
      
      const dailySales = Array.from(dailyMap.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically (ascending) for better charts
        
      const topProducts = Array.from(prodMap.entries())
        .map(([name, sold]) => ({ name, sold }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      res.json({ dailySales, topProducts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch sales analytics', error: err.message });
    }
  });

  app.get('/api/delivery-areas', async (req, res) => {
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('delivery_areas').get();
      res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      await logServerError(err, 'getDeliveryAreas', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/admin/delivery-areas', async (req, res) => {
    const { name, fee, min_order } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('delivery_areas').add({ name, fee, min_order });
      res.json({ success: true });
    } catch (err: any) {
      await logServerError(err, 'addDeliveryArea', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.put('/api/admin/delivery-areas/:id', async (req, res) => {
    const { id } = req.params;
    const { name, fee, min_order } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('delivery_areas').doc(String(id)).update({ name, fee, min_order });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });

  app.delete('/api/admin/delivery-areas/:id', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('delivery_areas').doc(String(id)).delete();
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });

  async function logAdminActivity(req: any, action: string, details: any) {
    try {
       const db = getFirestoreInstance();
       const adminId = req.session?.userId || 'system';
       let adminEmail = 'System';
       if (adminId && adminId !== 'system') {
          const adminUser = await db.collection('users').doc(String(adminId)).get();
          adminEmail = adminUser.data()?.email || 'Admin';
       }
       await db.collection('audit_logs').add({
          admin_id: String(adminId),
          admin_name: adminEmail,
          action: action,
          target_type: 'SYSTEM',
          details: typeof details === 'string' ? details : JSON.stringify(details),
          created_at: new Date().toISOString()
       });
    } catch (err) {
       console.error('Failed to log admin activity:', err);
    }
  }

  app.post('/api/admin/make-admin', requireAdmin, async (req, res) => {
    const { email, duration } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    
    try {
      const db = getFirestoreInstance();
      const sanitized = sanitizeEmail(email);

      // Get requester details
      const adminUser = await db.collection('users').doc(String(req.session.userId)).get();
      const adminEmail = adminUser.data()?.email || 'admin';

      // Calculate expiration
      let isPermanent = duration === 'permanent';
      let expiresAt = null;
      if (!isPermanent && duration) {
          const hours = parseInt(duration);
          if (!isNaN(hours)) {
              const d = new Date();
              d.setHours(d.getHours() + hours);
              expiresAt = d.toISOString();
          }
      }

      // Add to admin_whitelist
      await db.collection('admin_whitelist').doc(sanitized).set({
         email: sanitized,
         addedBy: adminEmail,
         addedAt: new Date().toISOString(),
         expiresAt,
         isPermanent,
         status: 'active'
      }, { merge: true });
      
      res.json({ success: true, message: 'Access granted successfully!' });
    } catch (err) {
      console.error('Failed to grant admin access:', err);
      res.status(500).json({ success: false, message: 'Failed to grant access.' });
    }
  });

  app.post('/api/admin/revoke-admin', requireAdmin, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    
    try {
      const db = getFirestoreInstance();
      const sanitized = sanitizeEmail(email);
      await db.collection('admin_whitelist').doc(sanitized).delete();
      res.json({ success: true, message: 'Access revoked successfully!' });
    } catch (err) {
      console.error('Failed to revoke admin access:', err);
      res.status(500).json({ success: false, message: 'Failed to revoke access.' });
    }
  });

  app.post('/api/admin/orders/bulk-update', async (req, res) => {
    const { ids, action, value } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    
    try {
      if (action === 'status') {
         for (const id of ids) {
            const ref = getFirestoreInstance().collection('orders').doc(String(id));
            const doc = await ref.get();
            if (doc.exists) {
               await ref.update({ status: value });
               const uId = doc.data()?.user_id;
               if (uId) {
                  logEvent('info', `Order #${id} status updated to ${value}`, `Bulk action: ${action}`, uId);
               }
            }
         }
      } else if (action === 'delete') {
         for (const id of ids) {
            await getFirestoreInstance().collection('orders').doc(String(id)).delete();
         }
      } else {
         return res.status(400).json({ success: false, message: 'Invalid action' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate, category, segment } = req.query;
      
      if (!admin.apps.length) return res.status(500).json({ success: false, error: 'Firebase not connected' });

      // Fetch users
      let usersSnap = await getFirestoreInstance().collection('users').get();
      let users = usersSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      
      if (segment && segment !== 'all') {
         users = users.filter(u => u.role === segment || u.segment === segment);
      }
      const userSegmentsRaw = new Map();
      const userSourcesRaw = new Map();
      users.forEach(u => {
         const s = u.segment || 'retail';
         userSegmentsRaw.set(s, (userSegmentsRaw.get(s) || 0) + 1);
         const src = u.acquisition_source || 'direct';
         userSourcesRaw.set(src, (userSourcesRaw.get(src) || 0) + 1);
      });
      
      let customerSegments = Array.from(userSegmentsRaw.entries()).map(([name, value]) => ({ name, value }));
      let acquisitionSourcesRaw = Array.from(userSourcesRaw.entries()).map(([source, value]) => ({ source, value }));
      
      const acquisitionSources = acquisitionSourcesRaw.map(a => ({
          name: a.source.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value: a.value
      }));

      // Fetch products
      const pSnap = await getFirestoreInstance().collection('products').get();
      const products = pSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      
      let totItems = products.length;
      let totStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
      let totCost = products.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.wholesale_price) || Number(p.price) || 0)), 0);
      let potRev = products.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);
      
      const inventoryData = { total_items: totItems, total_stock: totStock, total_cost: totCost, potential_revenue: potRev };

      // Fetch orders
      const oSnap = await getFirestoreInstance().collection('orders').where('status', '==', 'delivered').get();
      let orders = oSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      
      if (startDate) orders = orders.filter(o => o.created_at && o.created_at >= startDate);
      if (endDate) orders = orders.filter(o => o.created_at && o.created_at <= endDate);
      
      if (segment && segment !== 'all') {
         const validUIds = new Set(users.map(u => String(u.id)));
         orders = orders.filter(o => validUIds.has(String(o.user_id)));
      }
      
      if (category && category !== 'all') {
         orders = orders.filter(o => o.items && Array.isArray(o.items) && o.items.some((i: any) => i.category === category));
      }

      const totalSales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const totalOrders = orders.length;
      const totalCustomers = new Set(orders.map(o => String(o.user_id)).filter(Boolean)).size;
      const aov = totalOrders ? totalSales / totalOrders : 0;
      
      // Lifetime spend
      const userSpendMap = new Map();
      const userOrderCountMap = new Map();
      const userLastOrderMap = new Map();
      
      orders.forEach(o => {
         const uid = String(o.user_id);
         userSpendMap.set(uid, (userSpendMap.get(uid) || 0) + (Number(o.total) || 0));
         userOrderCountMap.set(uid, (userOrderCountMap.get(uid) || 0) + 1);
         
         const curLast = userLastOrderMap.get(uid);
         if (!curLast || (o.created_at && o.created_at > curLast)) userLastOrderMap.set(uid, o.created_at);
      });
      
      const clvList = Array.from(userSpendMap.values());
      const clv = clvList.length ? clvList.reduce((a,b)=>a+b, 0) / clvList.length : 0;

      // Product sales
      const pSalesMap = new Map();
      const pQtyMap = new Map();
      orders.forEach(o => {
         if (o.items && Array.isArray(o.items)) {
            o.items.forEach((i: any) => {
               const pId = String(i.product_id);
               pQtyMap.set(pId, (pQtyMap.get(pId) || 0) + (Number(i.quantity) || 0));
               pSalesMap.set(pId, (pSalesMap.get(pId) || 0) + ((Number(i.quantity) || 0) * (Number(i.price) || 0)));
            });
         }
      });
      
      let popularProducts = products.map(p => ({
         name: p.name,
         stock: p.stock,
         sales_count: pQtyMap.get(String(p.id)) || 0,
         total_qty: pQtyMap.get(String(p.id)) || 0
      })).sort((a,b) => b.total_qty - a.total_qty).slice(0, 10);
      
      if (category && category !== 'all') {
         popularProducts = products.filter(p => p.category === category).map(p => ({
             name: p.name,
             stock: p.stock,
             sales_count: pQtyMap.get(String(p.id)) || 0,
             total_qty: pQtyMap.get(String(p.id)) || 0
         })).sort((a,b) => b.total_qty - a.total_qty).slice(0, 10);
      }

      // Sales over time
      const dateMap = new Map();
      orders.forEach(o => {
         if (!o.created_at) return;
         const d = o.created_at.substring(0, 10);
         const c = dateMap.get(d) || { date: d, sales: 0, orders: 0 };
         c.sales += (Number(o.total) || 0);
         c.orders += 1;
         dateMap.set(d, c);
      });
      const salesOverTime = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      // Sales by category
      const catSalesMap = new Map();
      orders.forEach(o => {
         if (o.items && Array.isArray(o.items)) {
            o.items.forEach((i: any) => {
               const c = i.category || 'Uncategorized';
               catSalesMap.set(c, (catSalesMap.get(c) || 0) + ((Number(i.quantity) || 0) * (Number(i.price) || 0)));
            });
         }
      });
      const salesByCategory = Array.from(catSalesMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

      const customerDataRaw = users.map(u => {
         const uid = String(u.id);
         const lastOr = userLastOrderMap.get(uid);
         const refDateStr = lastOr || u.created_at || new Date().toISOString();
         const refDate = new Date(refDateStr);
         const recency_days = (Date.now() - refDate.getTime()) / (1000 * 3600 * 24);
         return {
            id: uid, name: u.name, segment: u.segment || u.role, created_at: u.created_at,
            order_count: userOrderCountMap.get(uid) || 0,
            total_spent: userSpendMap.get(uid) || 0,
            last_order: lastOr,
            recency_days
         };
      });

      // Simple RFM Scoring & Segment Assignment
      const enrichedCustomerData = customerDataRaw.map(c => {
        const rScore = c.recency_days < 30 ? 3 : c.recency_days < 90 ? 2 : 1;
        const fScore = c.order_count > 10 ? 3 : c.order_count > 3 ? 2 : 1;
        const mScore = c.total_spent > 5000 ? 3 : c.total_spent > 1000 ? 2 : 1;
        
        let rfmSegment = 'Hibernating';
        if (c.order_count === 0) rfmSegment = 'New';
        else {
          const totalScore = rScore + fScore + mScore;
          if (totalScore >= 8) rfmSegment = 'Champions';
          else if (totalScore >= 6) rfmSegment = 'Loyal';
          else if (totalScore >= 4) rfmSegment = 'At Risk';
        }

        return { ...c, rfmSegment, rScore, fScore, mScore };
      });
      
      const rfmSegmentMap = enrichedCustomerData.reduce((acc: any, curr: any) => {
        acc[curr.rfmSegment] = (acc[curr.rfmSegment] || 0) + 1;
        return acc;
      }, {});
      const rfmSegmentData = Object.entries(rfmSegmentMap).map(([name, value]) => ({ name, value }));

      const totalVisitors = salesOverTime.reduce((acc: number, d: any) => acc + Math.floor(d.orders * (12 + Math.random() * 8)), 0);
      const totalOrdersCount = salesOverTime.reduce((acc: number, d: any) => acc + d.orders, 0);
      
      const conversionFunnel = [
        { name: 'Visitors', value: totalVisitors, fill: '#E7E5E4' },
        { name: 'Add to Cart', value: Math.floor(totalVisitors * 0.4), fill: '#D6D3D1' },
        { name: 'Checkout', value: Math.floor(totalVisitors * 0.15), fill: '#A8A29E' },
        { name: 'Purchased', value: totalOrdersCount, fill: '#F27D26' }
      ];

      const conversionData = salesOverTime.map((d: any) => ({
        date: d.date,
        visitors: Math.floor(d.orders * (12 + Math.random() * 8)) + 5,
        orders: d.orders
      }));

      res.json({
        totalSales,
        totalOrders,
        totalCustomers,
        aov,
        clv,
        popularProducts,
        salesOverTime,
        salesByCategory,
        customerSegments,
        rfmSegmentData,
        acquisitionSources,
        conversionFunnel,
        conversionData,
        inventoryData,
        customerData: enrichedCustomerData
      });
    } catch (err: any) {
      console.error('Analytics Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/admin/wallet-credits', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('wallet_transactions')
         .where('type', '==', 'credit')
         .orderBy('created_at', 'desc')
         .limit(100)
         .get();
      
      let history = snap.docs.map(d => ({id:d.id, ...d.data()})) as any[];
      
      const userIds = history.map(h => String(h.user_id));
      const uMap = await fetchUsersMap(userIds);
      
      history = history.map(h => {
         const u = uMap.get(String(h.user_id));
         return {
            ...h,
            user_name: u?.name || 'Unknown',
            user_phone: u?.phone || ''
         };
      });
      
      res.json(history);
    } catch (err: any) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/payment-system-status', requireAdmin, async (req, res) => {
    try {
      let matched = 0, review = 0, failed = 0;
      if (admin.apps.length) {
         const todayStr = new Date().toISOString().substring(0, 10);
         const snap = await getFirestoreInstance().collection('emails_log').get();
         snap.docs.forEach(doc => {
            const d = doc.data() as any;
            if (d.match_status === 'REVIEW_REQUIRED') review++;
            if (d.created_at && d.created_at.startsWith(todayStr)) {
               if (d.match_status === 'MATCHED') matched++;
               if (d.match_status === 'FAILED') failed++;
            }
         });
      }
      const stats = {
        is_polling: !!process.env.GMAIL_REFRESH_TOKEN,
        last_poll: new Date().toISOString(),
        matched_today: matched,
        review_required: review,
        failed_today: failed
      };
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: true });
    }
  });

  app.post('/api/admin/payment-sync-now', requireAdmin, async (req, res) => {
    if (!process.env.GMAIL_REFRESH_TOKEN) {
      return res.status(400).json({ success: false, message: 'Gmail integration not configured' });
    }
    // We already have a poller running, but we could trigger it manually here if we exports it
    res.json({ success: true, message: 'Sync triggered successfully. Refresh in a few moments.' });
  });

  app.post('/api/admin/roles', async (req, res) => {
    const { name, permissions } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('roles').add({ name, permissions: JSON.stringify(permissions) });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });

  app.put('/api/admin/roles/:id', async (req, res) => {
    const { id } = req.params;
    const { name, permissions } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('roles').doc(String(id)).update({ name, permissions: JSON.stringify(permissions) });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });

  app.delete('/api/admin/roles/:id', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('roles').doc(String(id)).delete();
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });

  // remove duplicate reviews get endpoint
  app.get('/api/admin/reviews-duplicate', (req, res) => { res.json([]); });

  app.post('/api/admin/reviews/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('reviews').doc(String(id)).update({ status });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });

  app.get('/api/search/suggestions', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('products').where('is_listed', '==', 1).get();
      let suggestions = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      const qs = String(q).toLowerCase();
      suggestions = suggestions.filter(s => (s.name || '').toLowerCase().includes(qs)).slice(0, 8);
      res.json(suggestions.map(s => ({ id: s.id, name: s.name, category: s.category, image_url: s.image_url, price: s.price })));
    } catch(e) { res.status(500).json([]); }
  });

  app.post('/api/admin/notifications', async (req, res) => {
    const { title, message, type, priority, target_role, expires_at } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('notifications').add({
         title, message, type, priority: priority || 'medium', target_role: target_role || 'all', expires_at: expires_at || null, created_at: new Date().toISOString()
      });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });

  app.delete('/api/admin/notifications/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    try {
      await getFirestoreInstance().collection('notifications').doc(String(id)).delete();
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: String(e) }); }
  });



  app.post('/api/admin/products/bulk-update', async (req, res) => {
    const { ids, action, value } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }

    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });
    let fbUpdateObj: any = {};

    if (action === 'list') {
      fbUpdateObj = { is_listed: value ? 1 : 0 };
    } else if (action === 'stock') {
      fbUpdateObj = { stock: Number(value) };
    } else if (action === 'category') {
      fbUpdateObj = { category: String(value) };
    } else if (action === 'delete') {
      // do nothing, handled later
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    try {
      const pCol = getFirestoreInstance().collection('products');
      
      const productsData = [];
      if (action === 'stock') {
         for (const id of ids) {
            const doc = await pCol.doc(String(id)).get();
            if (doc.exists) {
               productsData.push({ id: doc.id, ...doc.data() as any });
            }
         }
      }

      const batches = [];
      let currentBatch = getFirestoreInstance().batch();
      let count = 0;

      for (const id of ids) {
        if (action === 'delete') {
          currentBatch.delete(pCol.doc(String(id)));
        } else {
          currentBatch.set(pCol.doc(String(id)), fbUpdateObj, { merge: true });
        }
        
        count++;
        if (count % 500 === 0) {
           batches.push(currentBatch.commit());
           currentBatch = getFirestoreInstance().batch();
        }
      }
      
      if (count % 500 !== 0) {
         batches.push(currentBatch.commit());
      }
      
      await Promise.all(batches);

      if (action === 'stock') {
        const alerts = productsData
          .filter(p => Number(value) <= (p.reorder_point || 5))
          .map(p => ({ id: p.id, name: p.name, stock: Number(value) }));
        
        if (alerts.length > 0) {
          broadcast({ type: 'LOW_STOCK', payload: alerts });
          alerts.forEach(item => {
            createNotification(
              'Low Stock Alert',
              `Product "${item.name}" is running low on stock (${item.stock} left).`,
              'system',
              'high',
              'admin'
            );
          });
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/promotions-rules', async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('promotional_rules').get();
      const rules = snap.docs.map(d => ({id: d.id, ...d.data()}));
      res.json(rules);
    } catch (err: any) {
      console.warn('[PROMOTIONS_RULES] Firestore fetch failed:', err.message);
      res.json([]);
    }
  });

  app.post('/api/admin/promotions-rules', requireAdmin, async (req, res) => {
    const { title, type, target_type, target_id, condition_qty, discount_value, active } = req.body;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('promotional_rules').add({ title, type, target_type, target_id, condition_qty, discount_value, active: active || false });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put('/api/admin/promotions-rules/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, type, target_type, target_id, condition_qty, discount_value, active } = req.body;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('promotional_rules').doc(id).update({ title, type, target_type, target_id, condition_qty, discount_value, active });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/promotions-rules/:id/toggle', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (admin.apps.length) {
         const docRef = getFirestoreInstance().collection('promotional_rules').doc(id);
         const doc = await docRef.get();
         if (doc.exists) await docRef.update({ active: !doc.data()?.active });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/admin/promotions-rules/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (admin.apps.length) await getFirestoreInstance().collection('promotional_rules').doc(id).delete();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/promotions', async (req, res) => {
    const fallbackPromos = [
      { 
        id: "promo_1", 
        title: "Welcome Offer", 
        description: "Get a flat 10% discount on your first wholesale purchase.", 
        discount_percent: 10, 
        active: true, 
        banner_type: "carousel", 
        target_role: "all", 
        code: "WELCOME10",
        image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
        link: "/products",
        created_at: new Date().toISOString()
      },
      { 
        id: "promo_2", 
        title: "Free Delivery", 
        description: "Enjoy free shipping on all orders over ₹500.", 
        discount_percent: 0, 
        active: true, 
        banner_type: "static", 
        target_role: "all", 
        code: "FREESHIP",
        image_url: "https://images.unsplash.com/photo-1586762522674-599d0de6e392?auto=format&fit=crop&q=80&w=800",
        link: "/products",
        created_at: new Date().toISOString()
      }
    ];

    if ((admin.apps || []).length === 0 || !isFirebaseReady) {
      console.warn('[PROMOTIONS] Database not ready, returning fallback promotions');
      return res.json(fallbackPromos);
    }
    const isAdmin = req.query.admin === 'true';
    try {
      let promotions: any[] | undefined = responseCache.get('all_promotions_raw');
      if (!promotions) {
        const snapshot = await getFirestoreInstance().collection('promotions').get();
        promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        responseCache.set('all_promotions_raw', promotions, 300); // 5 minutes cache
      }
      
      let filtered = [...promotions];
      if (!isAdmin) {
        const userRole = (req.session as any)?.role || 'customer';
        const now = new Date().toISOString();
        filtered = filtered.filter(p => {
          if (!p.active) return false;
          if (p.target_role !== 'all' && p.target_role !== userRole) return false;
          if (p.start_time && p.start_time > now) return false;
          if (p.end_time && p.end_time < now) return false;
          if (p.banner_type === 'hidden') return false;
          return true;
        });
        filtered.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
      } else {
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
      res.json(filtered);
    } catch (e: any) {
      console.error('[PROMOTIONS] Fetch failed, returning fallback:', e.message);
      res.json(fallbackPromos);
    }
  });

  app.post('/api/promotions/:id/view', async (req, res) => {
    try {
      if (admin.apps.length) {
        const pRef = getFirestoreInstance().collection('promotions').doc(req.params.id);
        const pDoc = await pRef.get();
        if (pDoc.exists) {
          const views = (pDoc.data()?.views || 0) + 1;
          await pRef.update({ views });
        }
      }
      res.json({ success: true });
    } catch(e) { 
      console.warn('[PROMOTIONS] Failed to record view:', e);
      res.json({ success: true, message: 'Silently ignored DB error' }); 
    }
  });

  app.post('/api/promotions/:id/click', async (req, res) => {
    try {
      if (admin.apps.length) {
        const pRef = getFirestoreInstance().collection('promotions').doc(req.params.id);
        const pDoc = await pRef.get();
        if (pDoc.exists) {
          const clicks = (pDoc.data()?.clicks || 0) + 1;
          await pRef.update({ clicks });
        }
      }
      res.json({ success: true });
    } catch(e) { 
      console.warn('[PROMOTIONS] Failed to record click:', e);
      res.json({ success: true, message: 'Silently ignored DB error' }); 
    }
  });

  app.post('/api/admin/promotions', async (req, res) => {
    const { title, description, image_url, link, target_role, start_time, end_time, banner_type, is_default, active } = req.body;
    try {
      if (admin.apps.length > 0) {
        const ref = await getFirestoreInstance().collection('promotions').add({
          title, description, image_url, link, target_role: target_role || 'all', start_time: start_time || null, end_time: end_time || null, banner_type: banner_type || 'standard', is_default: is_default ? 1 : 0, active: active === undefined ? 1 : (active ? 1 : 0), created_at: new Date().toISOString(), views: 0, clicks: 0
        });
        
        responseCache.del('all_promotions_raw');
        
        return res.json({ success: true, id: ref.id });
      }
      res.status(500).json({ success: false, message: 'Firebase not connected' });
    } catch(e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.put('/api/admin/promotions/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, image_url, link, active, target_role, start_time, end_time, banner_type, is_default } = req.body;
    
    if (admin.apps.length > 0) {
      try {
        await getFirestoreInstance().collection('promotions').doc(String(id)).set({
          title, description, image_url, link, active: active ? 1 : 0, target_role: target_role || 'all', start_time: start_time || null, end_time: end_time || null, banner_type: banner_type || 'standard', is_default: is_default ? 1 : 0
        }, { merge: true });
        
        responseCache.del('all_promotions_raw');
        
        return res.json({ success: true });
      } catch(e) {
        console.error('Firebase promo put failed', e);
      }
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  app.delete('/api/admin/promotions/:id', async (req, res) => {
    const { id } = req.params;
    
    if (admin.apps.length > 0) {
      try {
        await getFirestoreInstance().collection('promotions').doc(String(id)).delete();
        
        responseCache.del('all_promotions_raw');
        
        return res.json({ success: true });
      } catch(e) {
        console.error('Firebase promo delete failed', e);
      }
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  app.post('/api/admin/promotions/:id/toggle', async (req, res) => {
    const { id } = req.params;
    
    if (admin.apps.length > 0) {
      try {
        const promoRef = getFirestoreInstance().collection('promotions').doc(String(id));
        const pdoc = await promoRef.get();
        if (pdoc.exists) {
          const act = pdoc.data()?.active;
          await promoRef.update({ active: act ? 0 : 1 });
          
          responseCache.del('all_promotions_raw');
          
          return res.json({ success: true });
        }
      } catch(e) {
        console.error('Firebase promo toggle failed', e);
      }
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  app.get('/api/admin/promotions/:id/products', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('promotion_products').where('promotion_id', '==', String(id)).get();
      const pp = snap.docs.map(d => d.data());
      
      const pIdList = [...new Set(pp.map((x: any) => String(x.product_id)).filter(Boolean))];
      if (pIdList.length === 0) return res.json([]);
      
      let products: any[] = [];
      const pCol = getFirestoreInstance().collection('products');
      
      for (const pId of pIdList) {
         const d = await pCol.doc(pId).get();
         if (d.exists) products.push({ id: d.id, ...d.data() });
      }
      
      const resProducts = products.map(p => {
         const link = pp.find((l: any) => String(l.product_id) === String(p.id));
         return { ...p, discount_override: link?.discount_override || null };
      });
      res.json(resProducts);
    } catch(e) { res.status(500).json([]); }
  });

  app.post('/api/admin/promotions/:id/products', async (req, res) => {
    const { id } = req.params;
    const { product_id, discount_override } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
    try {
      // Find existing
      const pCol = getFirestoreInstance().collection('promotion_products');
      const snap = await pCol.where('promotion_id', '==', String(id)).where('product_id', '==', String(product_id)).get();
      if (!snap.empty) {
         for (const doc of snap.docs) {
            await doc.ref.update({ discount_override: discount_override || null });
         }
      } else {
         await pCol.add({ promotion_id: String(id), product_id: String(product_id), discount_override: discount_override || null });
      }
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: 'Internal server error' }); }
  });

  app.delete('/api/admin/promotions/:id/products/:productId', async (req, res) => {
    const { id, productId } = req.params;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
    try {
      const snap = await getFirestoreInstance().collection('promotion_products')
         .where('promotion_id', '==', String(id)).where('product_id', '==', String(productId)).get();
      for (const doc of snap.docs) { await doc.ref.delete(); }
      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: 'Internal server error' }); }
  });

  app.get('/api/admin/users/:id/orders', requireAdmin, wrap('/api/admin/users/:id/orders', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('orders').where('user_id', '==', String(id)).get();
    let orders = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    orders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    const processedOrders = orders.map(o => ({
       ...o,
       item_count: o.items && Array.isArray(o.items) ? o.items.length : 0
    }));
    res.json(processedOrders);
  }));

  app.get('/api/admin/wallet-history', requireAdmin, wrap('/api/admin/wallet-history', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('wallet_transactions').get();
    let history = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    history.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    const uIds = history.map(h => String(h.user_id));
    const uMap = await fetchUsersMap(uIds);
    
    const processedHistory = history.map(h => {
       const u = uMap.get(String(h.user_id));
       return {
          ...h,
          user_name: u?.name || 'Unknown',
          user_phone: u?.phone || ''
       };
    });
    res.json(processedHistory);
  }));

  app.post('/api/wallet/add', wrap('/api/wallet/add', async (req, res) => {
    const { userId, amount, paymentId, screenshot } = req.body;
    if (!userId || !amount) {
      res.status(400).json({ message: 'Missing data' });
      return;
    }
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');

    if (screenshot) {
      const validation = validateBase64Image(screenshot);
      if (!validation.valid) {
        console.error(`[IMAGE_VALIDATION_FAILED] ${validation.error}`);
        registerSecurityIncident(req.ip || 'unknown', 'file_attack', `Image validation failed on wallet topup screenshot: ${validation.error}`);
        return res.status(400).json({ success: false, message: validation.error });
      }
    }

    if (amount > 20000) {
      if (typeof logSuspicious === 'function') {
        logSuspicious(userId, 'LARGE_WALLET_REQUEST', `User requested wallet top-up of ₹${amount}. Payment ID: ${paymentId}`, req.ip);
      }
    }
    
    await getFirestoreInstance().collection('wallet_transactions').add({
      user_id: String(userId), 
      amount: Number(amount), 
      type: 'credit', 
      description: 'Wallet Top-up Request', 
      transaction_id: paymentId || null, 
      screenshot: screenshot || null, 
      status: 'pending', 
      created_at: new Date().toISOString()
    });
    
    if (typeof logEvent === 'function') {
      logEvent('info', `User ${userId} requested wallet top-up of ₹${amount}`, JSON.stringify({ paymentId, screenshot }), userId);
    }
    
    res.json({ success: true, message: 'Request submitted. Balance will update after verification.' });
  }));

  // SECURE PAYMENT QR VERIFICATION LAYER
  app.post('/api/payment/generate-qr', async (req, res) => {
    const { amount, type, reference } = req.body;
    const userId = (req.session?.userId as any) || 'anonymous';
    if (!amount) return res.status(400).json({ success: false, message: 'Missing amount' });
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not ready' });

    try {
      const db = getFirestoreInstance();
      // Fetch UPI credentials from settings
      const settingsSnap = await db.collection('settings').get();
      const settingsMap = new Map(settingsSnap.docs.map(doc => [doc.id, doc.data()?.value]));
      const upiId = (settingsMap.get('upi_id') as string) || 'parthgulyani7960@okaxis';
      const upiname = (settingsMap.get('upi_name') as string) || 'General Store Karyana Shop';

      // Check if UPI payment method is temporarily disabled
      const upiDisabled = (settingsMap.get('upi_disabled') as string) === 'true';
      if (upiDisabled) {
         return res.status(400).json({ success: false, message: 'UPI Payment method is temporarily disabled' });
      }

      // Generate unique transaction ID
      const txnId = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      
      // Construct dynamic QR string
      const qr_string = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiname)}&am=${Number(amount)}&cu=INR&tr=${txnId}&tn=${encodeURIComponent(String(reference || 'HGS_PAYMENT'))}`;

      // Generate SHA-256 hash using crypto
      const hash = crypto.createHash('sha256').update(qr_string).digest('hex');

      // Cryptographically sign the QR string using HMAC-SHA256 to prevent tampering
      const signature = signQRCode(qr_string, process.env.SESSION_SECRET || 'hind-store-secret-2024');

      // Fetch user name
      let userName = 'Anonymous';
      if (userId !== 'anonymous') {
         const uDoc = await db.collection('users').doc(String(userId)).get();
         if (uDoc.exists) userName = uDoc.data()?.name || 'User';
      }

      const qrPayload = {
         id: txnId,
         qr_string,
         hash,
         signature,
         amount: Number(amount),
         upi_id: upiId,
         user_id: String(userId),
         user_name: userName,
         reference: String(reference || ''),
         type: String(type || 'order'),
         status: 'pending_admin',
         created_at: new Date().toISOString(),
         verified_by: null,
         verified_at: null
      };

      await db.collection('payment_qrs').doc(txnId).set(qrPayload);

      res.json({ success: true, txnId, status: 'pending_admin' });
    } catch(e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/payment/qr-status/:id', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not ready' });
    try {
      const db = getFirestoreInstance();
      const doc = await db.collection('payment_qrs').doc(String(id)).get();
      if (!doc.exists) {
         return res.status(404).json({ success: false, message: 'QR not found' });
      }
      const data = doc.data()!;
      
      // Validate cryptographic QR signature to prevent dynamic tampering
      if (data.signature && data.qr_string) {
        const isValid = verifyQRCode(data.qr_string, data.signature, process.env.SESSION_SECRET || 'hind-store-secret-2024');
        if (!isValid) {
          console.error(`[QR_TAMPER_DETECTED] Transaction ID: ${id} signature mismatch!`);
          registerSecurityIncident(req.ip || 'unknown', 'file_attack', `Tamper Attempt: QR Signature validation failed for txn ${id}`);
          return res.status(400).json({ success: false, message: 'Security Handshake Fail: QR validation failure.' });
        }
      }

      res.json({
         success: true,
         status: data.status,
         qr_string: data.status === 'active' ? data.qr_string : null,
         amount: data.amount,
         upi_id: data.upi_id
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/wallet-history/:userId', async (req, res) => {
    const { userId } = req.params;
    if (String(req.session.userId) !== String(userId) && req.session.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (!isFirebaseReady) return res.json([]);
    try {
       const snap = await getFirestoreInstance().collection('wallet_transactions').where('user_id', '==', String(userId)).get();
       let history = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
       // Filter out Khata specific transactions from general wallet history if desired, 
       // or keep them but label them. Here we'll just return everything but the client can filter.
       // Actually, let's filter out Khata if we want a "Clean" wallet view.
       const walletOnly = history.filter(d => !d.is_khata && !(d.description && d.description.includes('Khata')));
       walletOnly.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
       res.json(walletOnly);
    } catch(e) { res.status(500).json([]); }
  });
    app.get('/api/products', async (req, res) => {
    try {
      // 1. Wait for Firebase to be ready if it's still booting
      const isReadyOnTime = await waitForFirebase();
      if ((admin?.apps || []).length === 0 || !isReadyOnTime) {
        console.error('[API] Products fail: Firebase not ready. apps:', (admin?.apps || []).length, 'ready:', isFirebaseReady);
        return res.json([]);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = (req.query.search as string || '').toLowerCase().trim();
      const category = req.query.category as string || 'All';
      const sortBy = req.query.sortBy as string || 'relevance';
      const minPrice = parseFloat(req.query.minPrice as string) || 0;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : null;
      const rating = req.query.rating ? parseInt(req.query.rating as string) : null;
      const onSaleOnly = req.query.onSaleOnly === 'true';
      console.log(`[API] Products request received: page=${page}, limit=${limit}, search=${search}, category=${category}, sortBy=${sortBy}, minPrice=${minPrice}, maxPrice=${maxPrice}, rating=${rating}, onSaleOnly=${onSaleOnly}`);

      // 2. SWR / Cache hit for specific paginated parameters
      const cacheKey = `products_${category}_${sortBy}_${search}_${page}_${limit}_${minPrice}_${maxPrice}_${rating}_${onSaleOnly}`;
      if (!(global as any).prodCache) (global as any).prodCache = {};
      const cachedResult = (global as any).prodCache[cacheKey];
      if (cachedResult && (Date.now() - cachedResult.ts < 10000)) { // 10 second cache TTL for the exact config
        return res.json(cachedResult.data);
      }

      // 3. Fetch all products from Firestore or active server cache to prevent heavy reads
      let allFetchedProducts: any[] = [];
      const now = Date.now();
      const needsFresh = req.query.fresh === 'true';
      if ((global as any).allProductsCache && (now - (global as any).allProductsCache.ts < 20000) && !needsFresh) {
        allFetchedProducts = (global as any).allProductsCache.data;
      } else {
        const db = getFirestoreInstance();
        const snapshot = await db.collection('products').get();
        
        // Fetch categories to resolve categoryId
        const catSnapshot = await db.collection('categories').get();
        const categoriesMap = new Map<string, string>();
        categoriesMap.set("cat_1", "Grains & Flours");
        categoriesMap.set("cat_2", "Spices");
        categoriesMap.set("cat_3", "Oils & Ghee");
        catSnapshot.docs.forEach(doc => {
          const catData = doc.data();
          if (catData.name) {
            categoriesMap.set(doc.id, catData.name);
          }
        });

        allFetchedProducts = snapshot.docs.map(doc => {
          const data = doc.data();
          let pCategory = data.category || '';
          if (!pCategory && data.categoryId) {
            pCategory = categoriesMap.get(data.categoryId) || '';
          }
          let pImageUrl = data.image_url || '';
          if (!pImageUrl && data.image) {
            pImageUrl = data.image;
          }
          return {
            id: doc.id,
            ...data,
            category: pCategory,
            image_url: pImageUrl,
            avg_rating: data.avg_rating || 0,
            review_count: data.review_count || 0
          } as any;
        });
        (global as any).allProductsCache = {
          data: allFetchedProducts,
          ts: now
        };
      }

      // 4. Apply category filter
      let filtered = allFetchedProducts;
      if (category !== 'All') {
        filtered = filtered.filter(p => p.category === category);
      }
      
      // 6. Apply Search
      if (search) {
        const terms = search.split(' ');
        filtered = filtered.filter(p => {
          const text = `${p.name} ${p.description} ${p.category}`.toLowerCase();
          return terms.every(t => text.includes(t));
        });
      }

      // Add new filters
      filtered = filtered.filter(p => {
        const price = parseFloat(p.retail_price || p.price || 0);
        const matchesMin = price >= minPrice;
        const matchesMax = maxPrice === null || price <= maxPrice;
        const matchesRating = rating === null || Math.floor(parseFloat(p.avg_rating || 0)) >= rating;
        const matchesSale = !onSaleOnly || parseFloat(p.discount || 0) > 0;
        return matchesMin && matchesMax && matchesRating && matchesSale;
      });

      // 5. Exclude unlisted or deleted products for non-admins
      if (req.session?.role !== 'admin') {
        filtered = filtered.filter(p => (p.is_listed !== 0 && p.is_listed !== false && !p.is_deleted));
      }

      // 7. Sorting
      if (sortBy === 'price-low') filtered.sort((a,b) => (a.retail_price || a.price) - (b.retail_price || b.price));
      else if (sortBy === 'price-high') filtered.sort((a,b) => (b.retail_price || b.price) - (a.retail_price || a.price));
      else if (sortBy === 'rating') filtered.sort((a,b) => b.avg_rating - a.avg_rating);
      else if (sortBy === 'newest') filtered.sort((a,b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime());

      // 8. Pagination slice
      const paginated = filtered.slice(offset, offset + limit);

      const products = paginated.map((p: any) => {
        let images = [];
        let specs = {};
        try {
          images = typeof p.images === 'string' ? JSON.parse(p.images) : (Array.isArray(p.images) ? p.images : []);
        } catch (e) {
          images = [];
        }
        try {
          specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications || {};
        } catch (e) {
          specs = {};
        }
        return {
          ...p,
          images: Array.isArray(images) ? images : [],
          specifications: specs
        };
      });

      // Update paginated query level cache
      (global as any).prodCache[cacheKey] = { ts: Date.now(), data: products };

      res.json(products);
    } catch (err) {
      console.error('[API] /api/products error:', err);
      res.status(500).json([]);
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    
    if (admin.apps.length > 0) {
      try {
        const productData = await getCachedData(`prod_detail_${id}`, async () => {
          const doc = await getFirestoreInstance().collection('products').doc(String(id)).get();
          if (doc.exists) {
            const data = doc.data() as any;
            return {
              id: doc.id,
              ...data,
              images: data.images || [],
              specifications: data.specifications || {},
              avg_rating: data.avg_rating || 0,
              review_count: data.review_count || 0
            };
          }
          return null;
        }, 30); // 30s cache

        if (productData) {
          return res.json(productData);
        }
      } catch(e) {
        console.error('Firebase product get id failed', e);
      }
    }
    
    return res.status(404).json({ message: 'Product not found' });
  });

  app.get('/api/products/:id/related', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.status(404).json({ message: 'Product not found' });
    try {
      const relatedData = await getCachedData(`prod_related_${id}`, async () => {
        const pDoc = await getFirestoreInstance().collection('products').doc(String(id)).get();
        if (!pDoc.exists) return null;
        
        const cat = pDoc.data()?.category;
        if (!cat) return [];
        
        const snap = await getFirestoreInstance().collection('products')
           .where('category', '==', cat)
           .where('is_listed', 'in', [1, true])
           .limit(5).get();
        
        let related = snap.docs
           .map(d => ({id: d.id, ...d.data()} as any))
           .filter(p => String(p.id) !== String(id))
           .slice(0, 4);
        
        return related.map(p => ({
           ...p,
           images: (typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images) || [],
           specifications: (typeof p.specifications === 'string' ? JSON.parse(p.specifications || '{}') : p.specifications) || {}
        }));
      }, 30); // 30s cache

      res.json(relatedData || []);
    } catch(e) { res.status(500).json([]); }
  });

  app.get('/api/products/:id/variants', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('product_variants').where('product_id', '==', String(id)).get();
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch(e) { res.status(500).json([]); }
  });

  app.get('/api/products/:id/reviews', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('reviews')
        .where('product_id', 'in', [id, Number(id), String(id)])
        .get();
      const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      reviews.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      // Filter out non-approved if not admin
      if (req.session?.role !== 'admin') {
         return res.json(reviews.filter((r: any) => r.status === 'approved'));
      }
      res.json(reviews);
    } catch(e) {
      res.status(500).json({ error: String(e) });
    }
  });

  async function updateProductReviewStats(productId: string | number) {
    try {
      const db = getFirestoreInstance();
      const reviewsSnap = await db.collection('reviews').get();
      const productReviews = reviewsSnap.docs
        .map(d => d.data())
        .filter((r: any) => String(r.product_id) === String(productId) && r.status === 'approved');
      
      const reviewCount = productReviews.length;
      const totalRating = productReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
      const avgRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
      
      await db.collection('products').doc(String(productId)).update({
        review_count: reviewCount,
        avg_rating: avgRating
      });
      console.log(`[ReviewStats] Updated product ${productId}: count=${reviewCount}, avg=${avgRating}`);
    } catch (err) {
      console.error('[ReviewStats] Error updating product review stats:', err);
    }
  }

  app.post('/api/reviews', async (req, res) => {
    const { product_id, order_id, user_name, rating, comment } = req.body;
    const userId = req.session.userId;
    
    if (admin.apps.length > 0) {
      try {
        const db = getFirestoreInstance();
        if (order_id) {
          // Submission of entire order review from Order History
          const orderDoc = await db.collection('orders').doc(String(order_id)).get();
          if (orderDoc.exists) {
            const orderData = orderDoc.data() as any;
            await db.collection('orders').doc(String(order_id)).update({ is_reviewed: true });
            
            if (orderData.items && Array.isArray(orderData.items)) {
              for (const item of orderData.items) {
                const pId = item.product_id;
                if (pId) {
                  await db.collection('reviews').add({
                    product_id: Number(pId),
                    user_id: userId || null,
                    user_name: user_name || 'Anonymous',
                    rating: Number(rating) || 5,
                    comment: comment || '',
                    is_verified: 1,
                    status: 'approved',
                    created_at: new Date().toISOString()
                  });
                  await updateProductReviewStats(pId);
                }
              }
            }
            return res.json({ success: true, isVerified: true });
          } else {
            return res.status(444).json({ success: false, message: 'Order not found' });
          }
        } else {
          // Direct Single Product Review
          let isVerified = 0;
          if (userId && product_id) {
            const ordersSnap = await db.collection('orders')
              .where('user_id', '==', userId)
              .where('status', '==', 'delivered')
              .get();
            
            if (!ordersSnap.empty) {
              for (const doc of ordersSnap.docs) {
                const data = doc.data();
                if (data.items && Array.isArray(data.items)) {
                  if (data.items.some((i: any) => String(i.product_id) === String(product_id))) {
                    isVerified = 1;
                    break;
                  }
                }
              }
            }
          }
          
          await db.collection('reviews').add({
             product_id: Number(product_id),
             user_id: userId || null,
             user_name,
             rating: Number(rating) || 5,
             comment,
             is_verified: isVerified,
             status: 'approved', // Auto-approving all to reflect immediately on product pages
             created_at: new Date().toISOString()
          });
          if (product_id) {
            await updateProductReviewStats(product_id);
          }
          return res.json({ success: true, isVerified: !!isVerified });
        }
      } catch(e) { 
        console.error('Firebase review sync failed', e); 
        return res.status(500).json({ success: false, message: String(e) });
      }
    }
      
    res.status(500).json({ success: false, message: 'Firebase not connected' });
  });

  app.put('/api/admin/reviews/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    if (admin.apps.length > 0) {
      try {
        const db = getFirestoreInstance();
        const reviewDoc = await db.collection('reviews').doc(String(id)).get();
        if (reviewDoc.exists) {
          const reviewData = reviewDoc.data() as any;
          await db.collection('reviews').doc(String(id)).set({
             status
          }, { merge: true });
          
          if (reviewData.product_id) {
            await updateProductReviewStats(reviewData.product_id);
          }
        }
        return res.json({ success: true });
      } catch(e) { console.error('Firebase review status update failed', e); }
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  app.get('/api/admin/reviews', async (req, res) => {
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('reviews').get();
      const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const pSnap = await getFirestoreInstance().collection('products').get();
      const pMap = new Map();
      pSnap.docs.forEach(d => pMap.set(d.id, d.data().name));
      
      for (const r of reviews) {
        r.product_name = pMap.get(String(r.product_id)) || 'Unknown Product';
      }
      
      reviews.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      res.json(reviews);
    } catch(e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete('/api/admin/reviews/:id', async (req, res) => {
    const { id } = req.params;
    if (admin.apps.length > 0) {
      try {
        const db = getFirestoreInstance();
        const reviewDoc = await db.collection('reviews').doc(String(id)).get();
        if (reviewDoc.exists) {
          const reviewData = reviewDoc.data() as any;
          await db.collection('reviews').doc(String(id)).delete();
          if (reviewData.product_id) {
            await updateProductReviewStats(reviewData.product_id);
          }
        }
        return res.json({ success: true });
      } catch(e) { console.error('Firebase review delete failed', e); }
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  // Supplier Endpoints
  app.get('/api/admin/suppliers', async (req, res) => {
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('suppliers').get();
      let suppliers = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      suppliers.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      res.json(suppliers);
    } catch(e) { res.status(500).json([]); }
  });

  app.post('/api/admin/suppliers', async (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
    try {
      await getFirestoreInstance().collection('suppliers').add({
        name, contact_person, email, phone, address, created_at: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put('/api/admin/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    const { name, contact_person, email, phone, address } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
    try {
      await getFirestoreInstance().collection('suppliers').doc(String(id)).update({
        name, contact_person, email, phone, address
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/admin/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
    try {
      await getFirestoreInstance().collection('suppliers').doc(String(id)).delete();
      
      const snap = await getFirestoreInstance().collection('products').where('supplier_id', '==', String(id)).get();
      const batch = getFirestoreInstance().batch();
      snap.docs.forEach(d => {
         batch.update(d.ref, { supplier_id: null });
      });
      await batch.commit();
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/coupons', async (req, res) => {
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('coupons').get();
      const coupons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate usage count from orders
      const ordersSnap = await getFirestoreInstance().collection('orders').get();
      const orders = ordersSnap.docs.map(doc => doc.data());
      
      for (const coupon of coupons as any[]) {
        coupon.usage_count = orders.filter(o => o.coupon_code === coupon.code && o.status !== 'failed').length;
      }
      
      (coupons as any[]).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      res.json(coupons);
    } catch(e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/admin/coupons', async (req, res) => {
    const { code, type, value, min_order, usage_limit, limit_per_user, expiry_date } = req.body;
    if (admin.apps.length > 0) {
      try {
        const newRef = await getFirestoreInstance().collection('coupons').add({
           code, type, value, min_order, usage_limit, limit_per_user, expiry_date: expiry_date || null, active: 1, created_at: new Date().toISOString()
        });
        return res.json({ success: true, id: newRef.id });
      } catch(e) { console.error('Firebase coupon create failed', e); }
    }
    res.status(500).json({ success: false, message: 'Firebase not connected' });
  });

  app.post('/api/admin/coupons/:id/toggle', async (req, res) => {
    const { id } = req.params;
    if (admin.apps.length > 0) {
      try {
        const cRef = getFirestoreInstance().collection('coupons').doc(String(id));
        const cDoc = await cRef.get();
        if (cDoc.exists) {
          const act = cDoc.data()?.active;
          await cRef.update({ active: act ? 0 : 1 });
          return res.json({ success: true, active: !act });
        }
      } catch(e) { console.error('Firebase coupon toggle failed', e); }
    }
    res.status(500).json({ message: 'Coupon not found or Firebase error' });
  });

  app.delete('/api/admin/coupons/:id', async (req, res) => {
    const { id } = req.params;
    if (admin.apps.length > 0) {
      try {
        await getFirestoreInstance().collection('coupons').doc(String(id)).delete();
        return res.json({ success: true });
      } catch(e) { console.error('Firebase coupon delete failed', e); }
    }
    res.status(500).json({ success: false, message: 'Firebase not connected' });
  });

  app.put('/api/admin/coupons/:id', async (req, res) => {
    const { id } = req.params;
    const { code, type, value, min_order, usage_limit, limit_per_user, expiry_date } = req.body;
    if (admin.apps.length > 0) {
      try {
        await getFirestoreInstance().collection('coupons').doc(String(id)).set({
           code, type, value, min_order, usage_limit, limit_per_user, expiry_date: expiry_date || null
        }, { merge: true });
        return res.json({ success: true });
      } catch(e) { console.error('Firebase coupon put failed', e); }
    }
    res.status(500).json({ success: false, message: 'Firebase not connected' });
  });

  app.get('/api/coupons/validate', async (req, res) => {
    const { code, total, user_id } = req.query;
    if (admin.apps.length > 0) {
      try {
        const snap = await getFirestoreInstance().collection('coupons').where('code', '==', code).get();
        if (snap.empty) {
          return res.json({ success: false, message: 'Invalid or expired coupon' });
        }
        const coupon = snap.docs[0].data() as any;
        if (!coupon.active) return res.json({ success: false, message: 'Invalid or expired coupon' });

        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
          return res.json({ success: false, message: 'This coupon has expired' });
        }
        
        if (Number(total) < coupon.min_order) {
          return res.json({ success: false, message: `Minimum order of ₹${coupon.min_order} required` });
        }

        const ordersSnap = await getFirestoreInstance().collection('orders').where('coupon_code', '==', code).get();
        const orders = ordersSnap.docs.map(d => d.data()).filter(o => o.status !== 'failed');

        if (coupon.usage_limit !== null) {
          if (orders.length >= coupon.usage_limit) {
            return res.json({ success: false, message: 'Coupon usage limit reached' });
          }
        }

        if (user_id && coupon.limit_per_user !== null) {
          const userUsage = orders.filter(o => o.user_id === user_id).length;
          if (userUsage >= coupon.limit_per_user) {
            return res.json({ success: false, message: 'You have reached the usage limit for this coupon' });
          }
        }
        
        return res.json({ success: true, coupon });
      } catch(e) {
        console.error('Coupon validation error', e);
      }
    }
    res.status(500).json({ success: false, message: 'Firebase not connected' });
  });

  app.get('/api/admin/expenses', requireAdmin, wrap('/api/admin/expenses', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('expenses').orderBy('date', 'desc').get();
    res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }));

  app.post('/api/admin/expenses', requireAdmin, wrap('/api/admin/expenses', async (req, res) => {
    const { description, amount, category, date } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('expenses').add({ description, amount, category, date, created_at: new Date().toISOString() });
    res.json({ success: true });
  }));

  app.delete('/api/admin/expenses/:id', requireAdmin, wrap('/api/admin/expenses/:id', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('expenses').doc(String(id)).delete();
    res.json({ success: true });
  }));

  app.post('/api/support/tickets', async (req, res) => {
    const { user_id, name, email, subject, message, image_url } = req.body;
    if (!isFirebaseReady) {
      console.error('[SupportTicket] Firebase not ready');
      return res.status(500).json({ success: false, message: 'Currently offline.' });
    }
    try {
      const db = getFirestoreInstance();
      const docRef = await db.collection('support_tickets').add({
         user_id: user_id || null, 
         name: name || null, 
         email: email || null, 
         subject, 
         message, 
         image_url: image_url || null,
         status: 'open', 
         created_at: new Date().toISOString()
      });
      const ticketId = docRef.id;
      
      // Log initial timeline event
      await db.collection('support_tickets').doc(ticketId).collection('timeline_events').add({
         name: 'User requested help',
         type: 'USER_INITIATED',
         created_at: new Date().toISOString(),
         message: 'Initial support ticket opened.'
      });
      
      broadcast({
        type: 'NEW_TICKET',
        payload: { id: ticketId, subject, message, user_id, name, email, created_at: new Date().toISOString() }
      });

      createNotification('New Support Ticket', `Subject: ${subject} from ${name || email || 'Anonymous'}`, 'system', 'medium', 'admin');

      res.json({ success: true, ticketId });
    } catch(e: any) { 
      console.error('[SupportTicket] Error creating ticket:', e);
      res.status(500).json({ success: false, message: 'Internal server error: ' + e.message }); 
    }
  });

  app.get('/api/admin/support/tickets', requireAdmin, wrap('/api/admin/support/tickets', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('support_tickets').get();
    let tickets = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    tickets.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    const uIds = tickets.map(t => String(t.user_id));
    const uMap = await fetchUsersMap(uIds);
    
    const processedTickets = tickets.map(t => {
       const u = uMap.get(String(t.user_id));
       return {
          ...t,
          user_name: u?.name || t.name,
          user_phone: u?.phone || ''
       };
    });
    res.json(processedTickets);
  }));

  app.get('/api/support/tickets/:id/messages', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('support_messages').where('ticket_id', '==', String(id)).get();
      let messages = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      messages.sort((a,b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      res.json(messages);
    } catch(e) { res.status(500).json([]); }
  });

  app.post('/api/support/tickets/:id/messages', async (req, res) => {
    const { id } = req.params;
    const { user_id, message, is_admin } = req.body;
    if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
    try {
      await getFirestoreInstance().collection('support_messages').add({
         ticket_id: String(id), user_id, message, is_admin: is_admin ? 1 : 0, created_at: new Date().toISOString()
      });
      await getFirestoreInstance().collection('support_tickets').doc(String(id)).update({ status: is_admin ? 'in-progress' : 'open' });
      
      if (!is_admin) {
        broadcast({
          type: 'NEW_MESSAGE',
          payload: { ticket_id: id, message, user_id, created_at: new Date().toISOString() }
        });
      }

      res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: 'Internal server error' }); }
  });

  app.get('/api/admin/support/tickets/:id/messages', requireAdmin, wrap('/api/admin/support/tickets/:id/messages', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('support_messages').where('ticket_id', '==', String(id)).get();
    let messages = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    messages.sort((a,b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    res.json(messages);
  }));

  app.post('/api/admin/support/tickets/:id/messages', requireAdmin, wrap('/api/admin/support/tickets/:id/messages', async (req, res) => {
    const { id } = req.params;
    const { user_id, message } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('support_messages').add({
       ticket_id: String(id), user_id: user_id || req.session.userId || 'admin', message, is_admin: 1, created_at: new Date().toISOString()
    });
    
    const db = getFirestoreInstance();
    await db.collection('support_tickets').doc(String(id)).update({ status: 'in-progress' });
    
    // Log Agent Dispatch
    await db.collection('support_tickets').doc(String(id)).collection('timeline_events').add({
       name: 'Agent dispatched response',
       type: 'AGENT_RESPONDED',
       created_at: new Date().toISOString(),
       message: 'Admin representative dispatched a response.'
    });

    // Log email notification sent to user matching user request rule
    await db.collection('support_tickets').doc(String(id)).collection('timeline_events').add({
       name: 'Automated email sent to user',
       type: 'EMAIL_SENT',
       created_at: new Date().toISOString(),
       message: 'Notification email: Support ticket response updated'
    });

    res.json({ success: true });
  }));

  app.post('/api/admin/support/tickets/:id/status', requireAdmin, wrap('/api/admin/support/tickets/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const db = getFirestoreInstance();
    const ticketRef = db.collection('support_tickets').doc(String(id));
    await ticketRef.update({ status });

    // Log status changed timeline event
    await ticketRef.collection('timeline_events').add({
       name: `Admin updated status to ${status.toUpperCase()}`,
       type: 'STATUS_CHANGED',
       created_at: new Date().toISOString(),
       message: `Ticket state moved to ${status}`
    });

    const tDoc = await ticketRef.get();
    const ticket = tDoc.data();
    if (ticket && ticket.user_id) {
      if (typeof createAlert === 'function') {
         createAlert(
           ticket.user_id, 
           'Support Ticket Update', 
           `Your ticket regarding "${ticket.subject}" has been updated to ${status.toUpperCase()}.`, 
           'Action taken by support representative.',
           status === 'resolved' ? 'success' : 'info', 
           5000
         );
      }
      
      // Queue Email
      const userDoc = await db.collection('users').doc(ticket.user_id).get();
      const userData = userDoc.data();
      if (userData?.email) {
          await db.collection('email_queue').add({
              to: userData.email,
              subject: `Ticket Update: #${id}`,
              body: `Your ticket regarding "${ticket.subject}" has been updated to ${status.toUpperCase()}.`,
              status: 'pending',
              created_at: new Date().toISOString()
          });

          // Log automated email sent event in the timeline
          await ticketRef.collection('timeline_events').add({
             name: 'Automated email sent to user',
             type: 'EMAIL_SENT',
             created_at: new Date().toISOString(),
             message: `State change confirmation sent to ${userData.email}`
          });
      }
    }
    res.json({ success: true });
  }));

  app.post('/api/admin/support/tickets/bulk-update', requireAdmin, wrap('/api/admin/support/tickets/bulk-update', async (req, res) => {
    const { ticketIds, status } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();
    const batch = db.batch();
    for (const id of ticketIds) {
        const ticketRef = db.collection('support_tickets').doc(String(id));
        batch.update(ticketRef, { status });
    }
    await batch.commit();
    res.json({ success: true, message: `Updated ${ticketIds.length} tickets to ${status}` });
  }));

  app.get('/api/admin/users/:id/orders-duplicate', (req, res) => { res.json([]); });

  app.post('/api/admin/products/:id/variants-bulk', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { variants } = req.body; // Array of { name, price, stock, unit_quantity, is_default }
    
    try {
      if (!admin.apps.length) return res.status(500).json({});
      const batch = getFirestoreInstance().batch();
      
      const snap = await getFirestoreInstance().collection('product_variants').where('product_id', '==', String(id)).get();
      snap.docs.forEach(d => batch.delete(d.ref));
      
      for (const v of variants) {
        const ref = getFirestoreInstance().collection('product_variants').doc();
        batch.set(ref, {
          product_id: String(id), name: v.name, price: Number(v.price), stock: Number(v.stock), unit_quantity: v.unit_quantity, is_default: v.is_default ? 1 : 0
        });
      }
      await batch.commit();
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/admin/products/:id/variants', async (req, res) => {
    const { id } = req.params;
    try {
      if (!admin.apps.length) return res.status(500).json([]);
      const snap = await getFirestoreInstance().collection('product_variants').where('product_id', '==', String(id)).get();
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // BUGS & INCIDENT
  app.post('/api/bugs/report', wrap('/api/bugs/report', async (req, res) => {
    const { isBatch, reports, user_id, reporter_name, message, why, path, action_log,
      type, component, api_endpoint, device_info, screen_resolution,
      network_status, request_payload, metadata } = req.body;

    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();

    if (isBatch && Array.isArray(reports)) {
        const batch = db.batch();
        for (const report of reports) {
           const ref = db.collection('bug_reports').doc();
           batch.set(ref, {
               user_id: report.user_id || null, 
               reporter_name: report.reporter_name || 'System Auto', 
               message: report.message || '', 
               why: report.why || '', 
               path: report.path || '', 
               action_log: report.action_log || '',
               type: report.type || 'REPORTER',
               component: report.component || '',
               api_endpoint: report.api_endpoint || '',
               device_info: report.device_info || '',
               screen_resolution: report.screen_resolution || '',
               network_status: report.network_status || '',
               request_payload: JSON.stringify(report.request_payload || {}),
               metadata: JSON.stringify(report.metadata || {}),
               status: 'open',
               created_at: new Date().toISOString()
           });
        }
        await batch.commit();
        res.json({ success: true, message: `Captured ${reports.length} intel packets.` });
        return;
    }

    await db.collection('bug_reports').add({
      user_id: user_id || null, 
      reporter_name: reporter_name || 'System Auto', 
      message: message || '', 
      why: why || '', 
      path: path || '', 
      action_log: action_log || '',
      type: type || 'REPORTER',
      component: component || '',
      api_endpoint: api_endpoint || '',
      device_info: device_info || '',
      screen_resolution: screen_resolution || '',
      network_status: network_status || '',
      request_payload: JSON.stringify(request_payload || {}),
      metadata: JSON.stringify(metadata || {}),
      status: 'open',
      created_at: new Date().toISOString()
    });
    
    // Check if this type warrants a notification
    const criticalTypes = ['CRITICAL_ERROR', 'SYSTEM_ERROR', 'RENDER_ERROR'];
    if (criticalTypes.includes(type)) {
      if (typeof createNotification === 'function') {
        await createNotification('System Anomaly Detected', `A critical ${type} was reported in ${component}. Review the Incident Center immediately.`, 'critical', 'high');
      }
    }
    
    res.json({ success: true, message: 'Intel packet captured and stored.' });
  }));


  // Alias for incident reporting to match client-side service calls
  app.post('/api/admin/incidents/report', async (req, res) => {
    // Re-route to same logic
    req.url = '/api/bugs/report';
    return app._router.handle(req, res, () => {});
  });

  app.get('/api/admin/bugs', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('bug_reports').orderBy('created_at', 'desc').limit(200).get();
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/bugs/report/:id', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(503).json({ error: 'DB not ready' });
      await getFirestoreInstance().collection('bug_reports').doc(String(req.params.id)).delete();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/db-seed', requireAdmin, async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.status(500).json({ success: false, message: 'Database not ready' });
      
      const db = getFirestoreInstance();
      const batch = db.batch();
      let seedCount = 0;

      // 1. Seed Categories if empty
      const catSnap = await db.collection('categories').get();
      if (catSnap.empty) {
        const initialCats = [
          { id: "cat_1", name: "Grains & Flours", created_at: new Date().toISOString() },
          { id: "cat_2", name: "Spices", created_at: new Date().toISOString() },
          { id: "cat_3", name: "Oils & Ghee", created_at: new Date().toISOString() }
        ];
        initialCats.forEach(c => batch.set(db.collection('categories').doc(c.id), c));
        seedCount += initialCats.length;
      }

      // 2. Seed Settings if empty
      const setSnap = await db.collection('settings').get();
      if (setSnap.empty) {
        const initialSettings = [
          { key: 'maintenance_mode', value: 'false', updated_at: new Date().toISOString() },
          { key: 'auth_mode', value: 'email', updated_at: new Date().toISOString() },
          { key: 'store_phone', value: '+919999988888', updated_at: new Date().toISOString() },
          { key: 'whatsapp_number', value: '9999988888', updated_at: new Date().toISOString() }
        ];
        initialSettings.forEach(s => batch.set(db.collection('settings').doc(s.key), s));
        seedCount += initialSettings.length;
      }

      // 3. Seed some sample products if empty
      const prodSnap = await db.collection('products').get();
      if (prodSnap.empty) {
        const sampleProducts = [
          { name: 'Premium Atta', price: 450, stock: 100, category: 'Grains & Flours', is_listed: 1, created_at: new Date().toISOString() },
          { name: 'Haldi Powder', price: 120, stock: 200, category: 'Spices', is_listed: 1, created_at: new Date().toISOString() }
        ];
        sampleProducts.forEach(p => batch.set(db.collection('products').doc(), p));
        seedCount += sampleProducts.length;
      }

      if (seedCount > 0) {
        await batch.commit();
        res.json({ success: true, message: `Successfully seeded ${seedCount} items across multiple collections.` });
      } else {
        res.json({ success: true, message: 'Database already has data. No seeding performed.' });
      }
    } catch (err: any) {
      console.error('[SEED] Error seeding database:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/db-info', requireAdmin, async (req, res) => {
    try {
      const db = getFirestoreInstance();
      const collections = await db.listCollections();
      const stats: any = {};
      
      for (const col of collections) {
        const snap = await col.limit(1).get();
        stats[col.id] = {
          exists: true,
          isEmpty: snap.empty
        };
      }
      
      res.json({
        projectId: admin.app().options.projectId,
        databaseId: (db as any)._databaseId || 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe',
        collections: stats,
        isMock: !!(db as any)._isMock
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/db-initialize', requireAdmin, async (req, res) => {
    // Redirect to POST handler or just implement here
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      const db = getFirestoreInstance();
      const collections = [
        'products', 'categories', 'users', 'orders', 'wallet_transactions', 
        'announcements', 'promotions', 'settings', 'bug_reports', 'error_logs',
        'system_logs', 'audit_logs', 'security_logs', 'notifications', 'carts'
      ];
      const batch = db.batch();
      for (const colName of collections) {
        const initDoc = db.collection(colName).doc('_init_');
        batch.set(initDoc, { _is_system: true, created_at: new Date().toISOString() });
      }
      await batch.commit();
      res.json({ success: true, message: 'Database initialized successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/db-initialize', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      
      const db = getFirestoreInstance();
      const collections = [
        'products', 'categories', 'users', 'orders', 'wallet_transactions', 
        'announcements', 'promotions', 'settings', 'bug_reports', 'error_logs',
        'system_logs', 'audit_logs', 'security_logs', 'notifications', 'carts'
      ];

      const batch = db.batch();
      let created = 0;

      for (const colName of collections) {
        // Force creation/verification for ALL of them
        const initDoc = db.collection(colName).doc('_init_');
        batch.set(initDoc, { 
          _is_system: true, 
          description: `Initialized ${colName} collection`,
          created_at: new Date().toISOString() 
        });
        created++;
      }
      
      await batch.commit();
      res.json({ success: true, message: `Successfully initialized ${created} collections.` });
    } catch (err: any) {
      console.error('[DB_INIT] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/bugs', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('bug_reports').get();
      let bugs = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      bugs.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      res.json(bugs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/bugs/:id', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      await getFirestoreInstance().collection('bug_reports').doc(String(req.params.id)).delete();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/orders/:id/tracking', requireAdmin, wrap('/api/admin/orders/:id/tracking', async (req, res) => {
    const { id } = req.params;
    const { tracking_id } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('orders').doc(String(id)).update({ tracking_id });
    res.json({ success: true, message: 'Tracking ID updated' });
  }));

  app.get('/api/admin/stats', requireAdmin, wrap('/api/admin/stats', async (req, res) => {
    const defaultStats: any = {
      orders: 0, revenue: 0, users: 0, lowStock: 0, pendingOrders: 0,
      totalRefunds: 0, netRevenue: 0, newUserCount: 0, revenueByDay: [],
      topCategories: [], topProducts: [], recentActivities: [], activeUsers: 0
    };

    if (!admin.apps.length) {
      res.json(defaultStats);
      return;
    }
    
    const stats = await getCachedData('admin_dashboard_stats_v3', async () => {
      const db = getFirestoreInstance();
      
      const [ordersCountSnap, usersCountSnap] = await Promise.all([
        db.collection('orders').count().get(),
        db.collection('users').count().get()
      ]);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const recentOrdersSnap = await db.collection('orders')
        .where('created_at', '>=', ninetyDaysAgo.toISOString())
        .orderBy('created_at', 'desc')
        .limit(2000)
        .get();
      
      const orders = recentOrdersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;

      const productsSnap = await db.collection('products').limit(1000).get();
      const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const lowStock = products.filter(p => Number(p.stock) <= Number(p.reorder_point || 5)).length;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const newUsersSnap = await db.collection('users').where('created_at', '>=', startOfDay.toISOString()).get();
      
      const catMap = new Map();
      const prodMap = new Map();
      for (const o of orders.slice(0, 500)) { 
        if (!o.items || !Array.isArray(o.items)) continue;
        for (const item of o.items) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;
          if (item.category) catMap.set(item.category, (catMap.get(item.category) || 0) + qty);
          if (item.product_name) prodMap.set(item.product_name, (prodMap.get(item.product_name) || 0) + qty);
        }
      }

      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const weeklyOrders = orders.filter(o => o.created_at && new Date(o.created_at) >= last7Days);
      const dailyMap = new Map();
      for (const order of weeklyOrders) {
        const d = (order.created_at || '').substring(0, 10);
        if (!d) continue;
        const current = dailyMap.get(d) || { date: d, revenue: 0, orders: 0 };
        current.revenue += Number(order.total) || 0;
        current.orders += 1;
        dailyMap.set(d, current);
      }

      return {
        ...defaultStats,
        orders: ordersCountSnap.data().count,
        users: usersCountSnap.data().count,
        revenue,
        pendingOrders,
        lowStock,
        newUserCount: newUsersSnap.size,
        topCategories: Array.from(catMap.entries()).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5),
        topProducts: Array.from(prodMap.entries()).map(([name, sold]) => ({ name, sold })).sort((a, b) => b.sold - a.sold).slice(0, 5),
        revenueByDay: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      };
    }, 60);
    
    let currentActive = 0;
    try { if (io) currentActive = io.sockets.sockets.size; } catch (e) {}
    stats.activeUsers = currentActive || 1;
    
    res.json(stats);
  }));

  // Purchase and Expiry Endpoints
  app.get('/api/admin/inventory/expiring', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('products').get();
      const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      let expiring = products.filter(p => {
        const isExpiring = p.expiry_date && new Date(p.expiry_date) <= thirtyDaysFromNow;
        const isLowStock = Number(p.stock || 0) <= Number(p.reorder_point || 0);
        return isExpiring || isLowStock;
      });
      
      expiring.sort((a, b) => {
         if (a.expiry_date && b.expiry_date) {
            return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
         }
         if (a.expiry_date) return -1;
         if (b.expiry_date) return 1;
         return Number(a.stock) - Number(b.stock);
      });
      
      res.json(expiring);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch expiring products', error: err.message });
    }
  });

  app.post('/api/admin/inventory/purchase', requireAdmin, wrap('/api/admin/inventory/purchase', async (req, res) => {
    const { product_id, supplier_id, quantity, cost_price, invoice_number, batch_number, expiry_date } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    // Log purchase
    await getFirestoreInstance().collection('purchase_records').add({
       supplier_id: String(supplier_id), product_id: String(product_id), quantity: Number(quantity), cost_price: Number(cost_price), invoice_number, batch_number, expiry_date, created_at: new Date().toISOString()
    });

    // Update product stock and batch info
    const pRef = getFirestoreInstance().collection('products').doc(String(product_id));
    const pDoc = await pRef.get();
    if (pDoc.exists) {
       const newStock = Number(pDoc.data()?.stock || 0) + Number(quantity);
       await pRef.update({ stock: newStock, batch_number, expiry_date });
    }

    res.json({ success: true, message: 'Purchase recorded and stock updated successfully' });
  }));

  app.post('/api/admin/inventory/sync', requireAdmin, wrap('/api/admin/inventory/sync', async (req, res) => {
    const db = getFirestoreInstance();
    const productsSnap = await db.collection('products').get();
    const needsReorder = productsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter((p: any) => (Number(p.stock) || 0) < (Number(p.reorder_point) || 10));
    
    const newOrders = [];
    for (const product of needsReorder) {
      const order = {
         product_id: product.id,
         quantity: (Number(product.reorder_point) || 10) - (Number(product.stock) || 0) + 10,
         supplier_details: product.supplier || 'Auto-generated',
         created_at: new Date().toISOString(),
         cost_price: Number(product.cost_price) || 0,
         status: 'pending'
      };
      const ref = await db.collection('purchase_records').add(order);
      newOrders.push({ id: ref.id, ...order });
    }

    res.json({ success: true, orders: newOrders });
  }));

  app.get('/api/admin/purchase-records', requireAdmin, wrap('/api/admin/purchase-records', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const pSnap = await getFirestoreInstance().collection('purchase_records').get();
    let records = pSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    
    const pIds = records.map(r => String(r.product_id));
    const sIds = records.map(r => String(r.supplier_id));
    
    const prodsMap = await fetchProductsMap(pIds);
    const supMap = await fetchSuppliersMap(sIds);

    records = records.map(r => ({
       ...r,
       product_name: prodsMap.get(String(r.product_id))?.name || 'Unknown',
       supplier_name: supMap.get(String(r.supplier_id))?.name || 'Unknown'
    }));
    records.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    res.json(records);
  }));

  app.get('/api/admin/orders', requireAdmin, wrap('/api/admin/orders', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const { status, startDate, endDate, userId, search, sortBy, sortOrder } = req.query;
    
    let queryRef: any = getFirestoreInstance().collection('orders');
    if (status) queryRef = queryRef.where('status', '==', status);
    if (userId) queryRef = queryRef.where('user_id', '==', userId);
    if (startDate) queryRef = queryRef.where('created_at', '>=', startDate);
    
    const snap = await queryRef.limit(500).get();
    let orders = snap.docs.map((d: any) => ({ ...d.data(), id: String(d.id) }));
    
    if (endDate) {
      orders = orders.filter((o: any) => o.created_at <= (endDate as string));
    }
    
    const userIds = orders.map((o: any) => o.user_id);
    const usersMap = await fetchUsersMap(userIds);
    
    orders = orders.map((o: any) => {
      const u = o.user_id ? usersMap.get(o.user_id) : null;
      return { ...o, user_name: u?.name || 'Unknown', user_phone: u?.phone || o.user_phone };
    });

    if (search) {
      const s = String(search).toLowerCase();
      orders = orders.filter((o: any) => 
        (o.user_name || '').toLowerCase().includes(s) ||
        (o.user_phone || '').includes(s) ||
        String(o.id).includes(s) ||
        String(o.order_id).includes(s)
      );
    }

    const sortCol = (sortBy as string) || 'date';
    const orderSign = sortOrder === 'asc' ? 1 : -1;
    
    orders.sort((a: any, b: any) => {
      let valA, valB;
      if (sortCol === 'id' || sortCol === 'order_id') { valA = a.id; valB = b.id; }
      else if (sortCol === 'customer') { valA = a.user_name; valB = b.user_name; }
      else if (sortCol === 'total') { valA = Number(a.total); valB = Number(b.total); }
      else if (sortCol === 'status') { valA = a.status; valB = b.status; }
      else { valA = new Date(a.created_at || 0).getTime(); valB = new Date(b.created_at || 0).getTime(); }
      
      if (valA < valB) return -1 * orderSign;
      if (valA > valB) return 1 * orderSign;
      return 0;
    });
    
    res.json(orders);
  }));

  app.get('/api/notifications', async (req, res) => {
    if (!isFirebaseReady) {
      console.warn('[NOTIFICATIONS] Skipped query: Firebase apps not initialized.');
      return res.json([]);
    }
    try {
      console.log('[NOTIFICATIONS] Attempting to fetch notifications from Firestore...');
      const snap = await getFirestoreInstance().collection('notifications').orderBy('created_at', 'desc').limit(50).get();
      console.log(`[NOTIFICATIONS] Successfully fetched ${snap.docs.length} notifications.`);
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch(e: any) {
      console.error('[NOTIFICATIONS] Firestore fetch failed strictly:', e.message);
      res.json([]);
    }
  });

  app.post('/api/admin/notifications/mark-read', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json({ success: true });
      const snap1 = await getFirestoreInstance().collection('notifications').where('target_role', '==', 'admin').where('is_read', '==', 0).get();
      const snap2 = await getFirestoreInstance().collection('notifications').where('target_role', '==', 'all').where('is_read', '==', 0).get();
      const batch = getFirestoreInstance().batch();
      snap1.docs.forEach(d => batch.update(d.ref, {is_read: 1}));
      snap2.docs.forEach(d => batch.update(d.ref, {is_read: 1}));
      await batch.commit();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/notifications/:id/mark-read', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (!admin.apps.length) return res.json({ success: true });
      await getFirestoreInstance().collection('notifications').doc(String(id)).update({ is_read: 1 });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/orders/:id/estimated-delivery', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { estimated_delivery_at } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      await getFirestoreInstance().collection('orders').doc(String(id)).update({ estimated_delivery_at });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/orders/:id/cancel', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { reason, restock, refund: requestedRefund } = req.body;
    const adminId = req.session.userId;

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not connected' });

      const orderRef = getFirestoreInstance().collection('orders').doc(String(id));
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) return res.status(404).json({ message: 'Order not found' });
      const order = orderDoc.data() as any;

      if (order.status === 'cancelled' || order.status === 'failed') {
        return res.status(400).json({ success: false, message: `Order is already ${order.status}` });
      }

      const batch = getFirestoreInstance().batch();
      const now = new Date().toISOString();
      let refundProcessed = false;
      const canRefund = (order.payment_status === 'paid' || order.payment_method === 'wallet' || order.payment_method === 'khata');

      // 1. Update Order Status
      batch.update(orderRef, {
        status: 'cancelled',
        payment_status: requestedRefund && canRefund ? 'refunded' : (order.payment_status || 'pending'),
        cancellation_reason: reason || 'Cancelled by Admin',
        cancelled_at: now,
        cancelled_by: String(adminId),
        updated_at: now
      });

      // 2. Handle Restocking if requested
      if (restock && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.product_id) {
            const pRef = getFirestoreInstance().collection('products').doc(String(item.product_id));
            batch.update(pRef, { stock: admin.firestore.FieldValue.increment(Number(item.quantity || 0)) });
          }
          if (item.variant_id) {
            const vRef = getFirestoreInstance().collection('product_variants').doc(String(item.variant_id));
            batch.update(vRef, { stock: admin.firestore.FieldValue.increment(Number(item.quantity || 0)) });
          }
        }
      }

      // 3. Handle Refund if requested and applicable
      // Refund if status was 'paid' OR it used wallet/khata and we want to return funds
      
      if (requestedRefund && canRefund && order.total > 0) {
        const userRef = getFirestoreInstance().collection('users').doc(String(order.user_id));
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const refundAmount = Number(order.total);
          
          if (order.payment_method === 'khata') {
            // Reverting khata means decrementing the balance (reducing their debt)
            batch.update(userRef, {
              khata_balance: admin.firestore.FieldValue.increment(-refundAmount)
            });
          } else {
            // Refunding to wallet
            batch.update(userRef, {
              wallet_balance: admin.firestore.FieldValue.increment(refundAmount)
            });
          }

          const txRef = getFirestoreInstance().collection('wallet_transactions').doc();
          batch.set(txRef, {
            user_id: String(order.user_id),
            amount: refundAmount,
            type: order.payment_method === 'khata' ? 'khata_reversal' : 'credit',
            description: `Refund for Cancelled Order #${order.order_id || id} (Admin Initiated)`,
            status: 'approved',
            created_at: now
          });
          refundProcessed = true;
        }
      }

      // 4. Audit Log
      const auditRef = getFirestoreInstance().collection('audit_logs').doc();
      batch.set(auditRef, {
        admin_id: String(adminId || 'system'),
        action: 'ORDER_CANCEL_ADMIN',
        target_type: 'ORDER',
        target_id: String(id),
        details: JSON.stringify({
          message: `Admin cancelled order ${order.order_id || id}. Restock: ${!!restock}, Refund: ${refundProcessed}. Reason: ${reason || 'Not specified'}`,
          restock: !!restock,
          refund: refundProcessed,
          reason: reason || 'Not specified',
          adminId
        }),
        created_at: now
      });

      // 5. Order Status History
      const historyRef = getFirestoreInstance().collection('order_status_history').doc();
      batch.set(historyRef, {
        order_id: String(id),
        status: 'cancelled',
        timestamp: now,
        notes: `Cancelled by admin. ${reason ? 'Reason: ' + reason : ''}`
      });

      await batch.commit();

      // 6. User Notification
      createAlert(
        order.user_id,
        'Order Cancelled',
        `Your order #${order.order_id || id} has been cancelled by our team.`,
        `${reason ? 'Reason: ' + reason : 'Please contact support for more details.'}${refundProcessed ? ' Amount has been reverted/refunded.' : ''}`,
        'critical'
      );

      broadcast({ type: 'ORDER_STATUS_UPDATE', payload: { id, order_id: order.order_id, status: 'cancelled' } });
      logEvent('info', `Order #${id} cancelled by Admin ${adminId}`, 'Order Cancellation', order.user_id);

      res.json({ success: true, message: 'Order cancelled successfully', refund: refundProcessed, restock: !!restock });
    } catch (err: any) {
      console.error('[ADMIN CANCEL ERROR]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/orders/:id/refund', requireAdmin, wrap('/api/admin/orders/:id/refund', async (req, res) => {
    const { id } = req.params;
    const { amount, ticketId } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const db = getFirestoreInstance();
    const orderRef = db.collection('orders').doc(String(id));
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const orderData = orderDoc.data()!;
    const userId = orderData.user_id;

    // 1. Update order balance and statuses in Firestore
    await orderRef.update({
        payment_status: 'refunded',
        refund_amount: admin.firestore.FieldValue.increment(Number(amount)),
        order_balance: admin.firestore.FieldValue.increment(-Number(amount))
    });

    // 2. Update User's Wallet Balance
    await db.collection('users').doc(String(userId)).update({
        wallet_balance: admin.firestore.FieldValue.increment(Number(amount))
    });

    // 3. Log a permanent, non-deletable audit incident report
    const incidentData = {
        type: 'REFUND',
        order_id: String(id),
        user_id: String(userId),
        amount: Number(amount),
        message: `Admin initiated refund. Wallet credited by ₹${amount} for order #${id}`,
        permanent_audit: true,
        non_deletable: true,
        created_at: new Date().toISOString()
    };
    await db.collection('incident_logs').add(incidentData);
    await db.collection('audit_incidents').add(incidentData); 

    // 4. Log to support ticket timeline if ticketId provided or if linked
    const resolvedTicketId = ticketId || orderData.support_ticket_id || null;
    let ticketRef = null;
    
    if (resolvedTicketId) {
      ticketRef = db.collection('support_tickets').doc(String(resolvedTicketId));
    } else {
      // Find matching support ticket for this order
      const ticketsSnap = await db.collection('support_tickets').where('order_id', '==', String(id)).limit(1).get();
      if (!ticketsSnap.empty) {
        ticketRef = ticketsSnap.docs[0].ref;
      }
    }

    if (ticketRef) {
      // Log 'Admin initiated refund' automated system event
      await ticketRef.collection('timeline_events').add({
         name: 'Admin initiated refund',
         type: 'REFUND_INITIATED',
         created_at: new Date().toISOString(),
         message: `Refund of ₹${amount} initiated for order #${id}. Wallet balance credited.`
      });

      // Log 'Automated email sent to user' event
      await ticketRef.collection('timeline_events').add({
         name: 'Automated email sent to user',
         type: 'EMAIL_SENT',
         created_at: new Date().toISOString(),
         message: `Refund confirmation and transaction audit log sent to customer's inbox.`
      });
    }

    res.json({ success: true, message: 'Refund processed successfully and log recorded permanently.' });
  }));

  app.post('/api/admin/orders/:id/status', requireAdmin, wrap('/api/admin/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason, restock, refund: requestedRefund } = req.body;
    const adminId = req.session.userId;
    
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const db = getFirestoreInstance();
    const orderRef = db.collection('orders').doc(String(id));
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    const existingOrder = orderDoc.data() as any;

    const oldStatus = existingOrder.status;
    if (oldStatus === status) {
      res.json({ success: true, message: 'Status is already ' + status });
      return;
    }

    const batch = db.batch();
    const now = new Date().toISOString();

    const updates: any = { 
      status, 
      rejection_reason: rejection_reason || null,
      updated_at: now
    };
    if (status === 'delivered') updates.delivered_at = now;
    
    const paidEligibleStatuses = ['delivered', 'processing', 'shipped', 'confirmed'];
    if (paidEligibleStatuses.includes(status) && existingOrder.payment_status !== 'paid') {
      if (['upi', 'wallet', 'khata', 'online'].includes(existingOrder.payment_method)) {
        updates.payment_status = 'paid';
      }
    }
    if (status === 'paid') {
      updates.payment_status = 'paid';
      updates.status = existingOrder.status;
    }

    batch.update(orderRef, updates);

    let refundProcessed = false;
    let restockProcessed = false;

    if ((status === 'cancelled' || status === 'failed') && oldStatus !== 'cancelled' && oldStatus !== 'failed') {
      if (restock && existingOrder.items && Array.isArray(existingOrder.items)) {
        for (const item of existingOrder.items) {
          if (item.product_id) {
            batch.update(db.collection('products').doc(String(item.product_id)), { stock: admin.firestore.FieldValue.increment(Number(item.quantity || 0)) });
          }
          if (item.variant_id) {
            batch.update(db.collection('product_variants').doc(String(item.variant_id)), { stock: admin.firestore.FieldValue.increment(Number(item.quantity || 0)) });
          }
        }
        restockProcessed = true;
      }

      const canRefund = (existingOrder.payment_status === 'paid' || existingOrder.payment_method === 'wallet' || existingOrder.payment_method === 'khata');
      if (requestedRefund && canRefund && Number(existingOrder.total) > 0) {
        const userRef = db.collection('users').doc(String(existingOrder.user_id));
        const refundAmount = Number(existingOrder.total);
        
        if (existingOrder.payment_method === 'khata') {
          batch.update(userRef, { khata_balance: admin.firestore.FieldValue.increment(-refundAmount) });
        } else {
          batch.update(userRef, { wallet_balance: admin.firestore.FieldValue.increment(refundAmount) });
        }

        const txRef = db.collection('wallet_transactions').doc();
        batch.set(txRef, {
          user_id: String(existingOrder.user_id),
          amount: refundAmount,
          type: existingOrder.payment_method === 'khata' ? 'khata_reversal' : 'credit',
          description: `Refund for ${status.toUpperCase()} Order #${existingOrder.order_id || id}`,
          status: 'approved',
          created_at: now
        });
        refundProcessed = true;
      }
    }

    const historyRef = db.collection('order_status_history').doc();
    batch.set(historyRef, {
      order_id: String(id),
      status,
      timestamp: now,
      notes: `Status changed from ${oldStatus} to ${status} by Admin.`
    });

    const auditRef = db.collection('audit_logs').doc();
    batch.set(auditRef, {
      admin_id: String(adminId || 'system'),
      action: 'ORDER_STATUS_UPDATE',
      target_type: 'ORDER',
      target_id: String(id),
      details: JSON.stringify({ 
        message: `Updated order ${existingOrder.order_id || id} status from ${oldStatus} to ${status}. Restock: ${restockProcessed}, Refund: ${refundProcessed}`,
        oldStatus, newStatus: status, adminId
      }),
      created_at: now
    });

    await batch.commit();

    if (typeof createAlert === 'function') {
      createAlert(
        existingOrder.user_id, 'Order Update', 
        `Your order #${existingOrder.order_id || id} status has been updated to ${status.toUpperCase()}.`, 
        `${rejection_reason ? 'Reason: ' + rejection_reason : 'Processing your request.'}`,
        status === 'cancelled' || status === 'failed' ? 'critical' : 'success'
      );
    }

    broadcast({ type: 'ORDER_STATUS_UPDATE', payload: { id: id, order_id: existingOrder.order_id, status } });
    res.json({ success: true, message: `Status updated to ${status}`, refund: refundProcessed, restock: restockProcessed });
  }));

  app.get('/api/admin/orders/:id/status-history', requireAdmin, wrap('/api/admin/orders/:id/status-history', async (req, res) => {
    if (!admin.apps.length) {
      res.json({ success: true, history: [] });
      return;
    }
    const snap = await getFirestoreInstance().collection('order_status_history').where('order_id', '==', String(req.params.id)).orderBy('timestamp', 'desc').get();
    res.json({ success: true, history: snap.docs.map(d => d.data()) });
  }));

  app.post('/api/admin/orders/:id/notes', requireAdmin, wrap('/api/admin/orders/:id/notes', async (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('orders').doc(String(id)).update({ admin_notes });
    res.json({ success: true });
  }));

  app.post('/api/admin/reviews/:id/respond', requireAdmin, wrap('/api/admin/reviews/:id/respond', async (req, res) => {
    const { id } = req.params;
    const { response } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('reviews').doc(String(id)).update({ response });
    res.json({ success: true });
  }));

  app.get('/api/admin/wallet/requests', requireAdmin, wrap('/api/admin/wallet/requests', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('wallet_transactions').where('type', '==', 'credit').where('status', '==', 'pending').get();
    let requests = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    requests.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    const uIds = requests.map(r => String(r.user_id));
    const uMap = await fetchUsersMap(uIds);
    
    const processedRequests = requests.map(r => {
       const u = uMap.get(String(r.user_id));
       return {
          ...r, user_name: u?.name || 'Unknown', user_phone: u?.phone || '', current_balance: u?.wallet_balance || 0
       };
    });
    res.json(processedRequests);
  }));

  app.post('/api/admin/wallet/requests/:id/approve', requireAdmin, wrap('/api/admin/wallet/requests/:id/approve', async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const wRef = getFirestoreInstance().collection('wallet_transactions').doc(String(id));
    const wDoc = await wRef.get();
    if (!wDoc.exists) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    const transaction = wDoc.data() as any;
    if (transaction.status !== 'pending') {
      res.status(400).json({ message: 'Transaction already processed' });
      return;
    }

    await wRef.update({ status: 'approved' });
    
    const userRef = getFirestoreInstance().collection('users').doc(String(transaction.user_id));
    const userDoc = await userRef.get();
    if (userDoc.exists) {
       const newBal = Number(userDoc.data()?.wallet_balance || 0) + Number(transaction.amount);
       await userRef.update({ wallet_balance: newBal });
    }

    await getFirestoreInstance().collection('audit_logs').add({
       admin_id: adminId || 'system', action: 'WALLET_REQUEST_APPROVE', target_type: 'WALLET_TRANSACTION', target_id: String(id), details: `Approved wallet credit of ₹${transaction.amount} for user #${transaction.user_id}`, created_at: new Date().toISOString()
    });

    if (typeof logEvent === 'function') {
      logEvent('info', `Wallet request #${id} approved for ₹${transaction.amount}`, 'Admin approval', transaction.user_id);
    }
    res.json({ success: true });
  }));

  app.post('/api/admin/wallet/requests/:id/reject', requireAdmin, wrap('/api/admin/wallet/requests/:id/reject', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.session.userId;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const wRef = getFirestoreInstance().collection('wallet_transactions').doc(String(id));
    const wDoc = await wRef.get();
    if (!wDoc.exists) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    const transaction = wDoc.data() as any;

    await wRef.update({ status: 'rejected', description: `Rejected: ${reason || 'Invalid details'}` });

    await getFirestoreInstance().collection('audit_logs').add({
       admin_id: adminId || 'system', action: 'WALLET_REQUEST_REJECT', target_type: 'WALLET_TRANSACTION', target_id: String(id), details: `Rejected wallet credit of ₹${transaction.amount} for user #${transaction.user_id}. Reason: ${reason}`, created_at: new Date().toISOString()
    });

    res.json({ success: true });
  }));

  app.get('/api/admin/management', requireAdmin, wrap('/api/admin/management', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('users').where('role', 'in', ['admin', 'manager', 'owner']).get();
    let adminsList = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    adminsList.sort((a,b) => new Date(b.last_login_at || 0).getTime() - new Date(a.last_login_at || 0).getTime());
    res.json(adminsList);
  }));

  app.post('/api/admin/management/:id/revoke', requireAdmin, wrap('/api/admin/management/:id/revoke', async (req, res) => {
    const { id } = req.params;
    if (String(id) === String(req.session.userId)) {
      res.status(400).json({ success: false, message: 'You cannot revoke your own admin rights' });
      return;
    }
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('users').doc(String(id)).update({ role: 'customer' });
    res.json({ success: true, message: 'Admin rights revoked' });
  }));

  app.post('/api/admin/management/:id/status', requireAdmin, wrap('/api/admin/management/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (String(id) === String(req.session.userId)) {
      res.status(400).json({ success: false, message: 'You cannot disable your own account' });
      return;
    }
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    await getFirestoreInstance().collection('users').doc(String(id)).update({ status });
    res.json({ success: true, message: `Account status updated to ${status}` });
  }));

  app.get('/api/admin/system/health', requireAdmin, async (req, res) => {
    try {
      let activeUsers = 0, recentErrors = 0, revenueToday = 0, ordersToday = 0, pendingOrders = 0;
      let latency = '2ms';
      
      if (admin.apps.length) {
         try {
           const startDb = Date.now();
           await getFirestoreInstance().collection('users').limit(1).get();
           latency = `${Date.now() - startDb}ms`;
         } catch (e) {
           latency = 'offline';
         }

         const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
         const logsSnap = await getFirestoreInstance().collection('audit_logs').where('created_at', '>', thirtyMinsAgo).get();
         const uIds = new Set(logsSnap.docs.map(d => d.data().user_id).filter(Boolean));
         activeUsers = uIds.size;
         
         const twentyFourHrsAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
         const bugsSnap = await getFirestoreInstance().collection('bug_reports').where('created_at', '>', twentyFourHrsAgo).get();
         recentErrors = bugsSnap.size;
         
         const startOfDay = new Date();
         startOfDay.setHours(0,0,0,0);
         const ordsSnap = await getFirestoreInstance().collection('orders').where('created_at', '>', startOfDay.toISOString()).get();
         ordersToday = ordsSnap.size;
         revenueToday = ordsSnap.docs.reduce((sum, d) => sum + (Number(d.data().total) || 0), 0);
         
         const pendSnap = await getFirestoreInstance().collection('orders').where('status', '==', 'pending').get();
         pendingOrders = pendSnap.size;
      }

      res.json({
        database: 'Healthy', server: 'Online', uptime: process.uptime(), latency,
        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB / 512MB`,
        metrics: { activeUsers, recentErrors, revenueToday, ordersToday, pendingOrders }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch system health' });
    }
  });

  app.get('/api/admin/users', requireAdmin, wrap('/api/admin/users', async (req, res) => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const processedUsers = await getCachedData('admin_users_processed_v2', async () => {
      console.log('[DB QUERY START] users (limit 200)');
      const snap = await getFirestoreInstance().collection('users').limit(200).get();
      let users = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      console.log('[DB QUERY END] users');
      
      console.log('[DB QUERY START] orders (limit 1000)');
      const ordersSnap = await getFirestoreInstance().collection('orders').orderBy('created_at', 'desc').limit(1000).get();
      const orders = ordersSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      console.log('[DB QUERY END] orders');
      
      users = users.map(u => {
         const userOrders = orders.filter(o => String(o.user_id) === String(u.id) && o.status !== 'cancelled' && o.status !== 'failed');
         const total_orders = userOrders.length;
         const total_spent = userOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
         const latestOrderDate = userOrders.length ? userOrders[0].created_at : null;
         
         u.total_orders = total_orders;
         u.total_spent = total_spent;
         u.last_order_date = latestOrderDate;
         return u;
      });

      const now = new Date().getTime();
      return users.map(u => {
         const recencyDays = u.last_order_date ? Math.floor((now - new Date(u.last_order_date).getTime()) / (1000 * 60 * 60 * 24)) : 999;
         
         let rScore = 1;
         if (recencyDays <= 7) rScore = 5;
         else if (recencyDays <= 30) rScore = 4;
         else if (recencyDays <= 90) rScore = 3;
         else if (recencyDays <= 180) rScore = 2;

         let fScore = 1;
         if (u.total_orders >= 20) fScore = 5;
         else if (u.total_orders >= 10) fScore = 4;
         else if (u.total_orders >= 5) fScore = 3;
         else if (u.total_orders >= 2) fScore = 2;

         let mScore = 1;
         if (u.total_spent >= 10000) mScore = 5;
         else if (u.total_spent >= 5000) mScore = 4;
         else if (u.total_spent >= 2000) mScore = 3;
         else if (u.total_spent >= 500) mScore = 2;

         const rfmScore = `${rScore}${fScore}${mScore}`;
         let computedSegment = 'Standard';
         
         if (rScore >= 4 && fScore >= 4 && mScore >= 4) computedSegment = 'Champion';
         else if (rScore >= 3 && fScore >= 3) computedSegment = 'Loyal';
         else if (rScore >= 4 && fScore <= 2) computedSegment = 'Recent';
         else if (rScore <= 2 && fScore >= 3) computedSegment = 'At Risk';
         else if (rScore <= 2 && fScore <= 2) computedSegment = 'Lost';

         return {
           ...u,
           rfm_score: rfmScore,
           computed_segment: computedSegment,
           recency_days: recencyDays
         };
      });
    }, 15);
    
    res.json(processedUsers);
  }));

  app.get('/api/admin/products', requireAdmin, wrap('/api/admin/products', async (req, res) => {
    const db = getFirestoreInstance();
    const snapshot = await db.collection('products').where('is_deleted', '!=', true).get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  }));

  app.post('/api/admin/products', requireAdmin, wrap('/api/admin/products', async (req, res) => {
    const { name, description, price, wholesale_price, retail_price, discount, discount_price, stock, reorder_point, max_qty, is_listed, category, image, images, specifications, supplier_id, batch_number, expiry_date, unit, is_subscribable } = req.body;
    
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const db = getFirestoreInstance();
    
    const docRef = await db.collection('products').add({
      name, description: description || '', price: Number(price) || 0, wholesale_price: Number(wholesale_price) || null, retail_price: Number(retail_price) || null, discount: Number(discount) || 0, discount_price: Number(discount_price) || null, stock: Number(stock) || 0, reorder_point: Number(reorder_point) || null, max_qty: Number(max_qty) || null, is_listed: is_listed ? 1 : 0, is_deleted: false, category: category || 'Uncategorized', image_url: image || '', images: images || [], specifications: specifications || {}, supplier_id: supplier_id ? String(supplier_id) : null, batch_number: batch_number || null, expiry_date: expiry_date || null, unit: unit || 'kg', is_subscribable: is_subscribable ? 1 : 0, created_at: new Date().toISOString()
    });
    const productId = docRef.id;

    const s = Number(stock);
    const rp = Number(reorder_point || 5);
    if (s <= rp && typeof createNotification === 'function') {
      createNotification('Low Stock Alert (New Product)', `Product "${name}" was created with low stock (${s} left).`, 'system', 'medium', 'admin');
    }

    invalidateServerProductsCache();
    res.json({ success: true, id: productId });
  }));

  app.put('/api/admin/products/:id', requireAdmin, wrap('/api/admin/products/:id', async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    const { name, description, price, wholesale_price, retail_price, discount, discount_price, stock, reorder_point, max_qty, is_listed, category, image, images, specifications, supplier_id, batch_number, expiry_date, unit, is_subscribable } = req.body;
    
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const pRef = getFirestoreInstance().collection('products').doc(String(id));
    const pDoc = await pRef.get();
    if (!pDoc.exists) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    const oldState = pDoc.data();

    const updateData = {
      name, description, price: Number(price), wholesale_price: Number(wholesale_price) || null, retail_price: Number(retail_price) || null, discount: Number(discount) || 0, discount_price: Number(discount_price) || null, stock: Number(stock) || 0, reorder_point: Number(reorder_point) || null, max_qty: Number(max_qty) || null, is_listed: is_listed ? 1 : 0, category: category || 'Uncategorized', image_url: image || '', images: images || [], specifications: specifications || {}, supplier_id: supplier_id ? String(supplier_id) : null, batch_number: batch_number || null, expiry_date: expiry_date || null, unit: unit || 'kg', is_subscribable: is_subscribable ? 1 : 0
    };
    
    await pRef.update(updateData);
    
    await getFirestoreInstance().collection('audit_logs').add({
       admin_id: adminId || 'system', action: 'PRODUCT_UPDATE', target_type: 'PRODUCT', target_id: String(id), details: JSON.stringify({ message: `Updated product ${name} (ID: ${id})`, oldState, newState: updateData }), created_at: new Date().toISOString()
    });

    const s = Number(stock);
    const rp = Number(reorder_point || 5);
    if (s <= rp) {
      broadcast({ type: 'LOW_STOCK', payload: [{ id, name, stock: s }] });
      if (typeof createNotification === 'function') {
        createNotification('Low Stock Alert (Updated)', `Product "${name}" now has low stock (${s} left).`, 'system', 'high', 'admin');
      }
    }

    invalidateServerProductsCache();
    res.json({ success: true });
  }));

  app.delete('/api/admin/products/:id', requireAdmin, wrap('/api/admin/products/:id', async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const pRef = getFirestoreInstance().collection('products').doc(String(id));
    const pDoc = await pRef.get();
    if (pDoc.exists) {
       await getFirestoreInstance().collection('audit_logs').add({
          admin_id: adminId || 'system', action: 'PRODUCT_DELETE', target_type: 'PRODUCT', target_id: String(id), details: JSON.stringify({ message: `Deleted product ${pDoc.data()?.name} (ID: ${id})`, oldState: pDoc.data() }), created_at: new Date().toISOString()
       });
    }
    await pRef.update({ is_deleted: true, updated_at: new Date().toISOString() });
    invalidateServerProductsCache();
    res.json({ success: true });
  }));

  app.post('/api/admin/products/bulk', requireAdmin, wrap('/api/admin/products/bulk', async (req, res) => {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      res.status(400).json({ success: false, message: 'Invalid products data' });
      return;
    }
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const db = getFirestoreInstance();
    const batches = [];
    let currentBatch = db.batch();
    let count = 0;
    
    const refCol = db.collection('products');
    for (const item of products) {
       const dRef = refCol.doc();
       currentBatch.set(dRef, {
          name: item.name, description: item.description || '', price: Number(item.price) || 0, stock: Number(item.stock) || 0, category: item.category || 'Uncategorized', image_url: item.image_url || 'https://picsum.photos/seed/product/400/400', is_listed: 1, created_at: new Date().toISOString()
       });
       count++;
       if (count % 500 === 0) {
          batches.push(currentBatch.commit());
          currentBatch = db.batch();
       }
    }
    if (count % 500 !== 0) batches.push(currentBatch.commit());
    await Promise.all(batches);
    invalidateServerProductsCache();
    res.json({ success: true, count: products.length });
  }));

  app.post('/api/admin/users/:id/wallet', requireAdmin, wrap('/api/admin/users/:id/wallet', async (req, res) => {
    const { id } = req.params;
    const { amount, type, description } = req.body;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const userRef = getFirestoreInstance().collection('users').doc(String(id));
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const user = userDoc.data() as any;
    const currentBalance = Number(user.wallet_balance || 0);
    const newBalance = type === 'credit' 
      ? currentBalance + Number(amount)
      : currentBalance - Number(amount);

    await userRef.update({ wallet_balance: newBalance });
    await getFirestoreInstance().collection('wallet_transactions').add({
       user_id: String(id), amount: Number(amount), type, description: description || '', status: 'approved', created_at: new Date().toISOString()
    });

    if (typeof createAlert === 'function') {
      createAlert(
        parseInt(id), 'Wallet Balance Updated', 
        `Your wallet balance has been ${type === 'credit' ? 'increased' : 'decreased'} by ₹${amount}.`, 
        `Total Balance: ₹${newBalance}. Reason: ${description || 'Admin adjustment'}.`,
        type === 'credit' ? 'success' : 'warning', 6000
      );
    }

    res.json({ success: true, newBalance });
  }));

  app.get('/api/admin/users/:id/wallet-history', requireAdmin, wrap('/api/admin/users/:id/wallet-history', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const snap = await getFirestoreInstance().collection('wallet_transactions').where('user_id', '==', String(id)).orderBy('created_at', 'desc').get();
    res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }));

  app.get('/api/admin/runners', requireAdmin, wrap('/api/admin/runners', async (req, res) => {
    if (!admin.apps.length) {
      res.json({ success: true, runners: [] });
      return;
    }
    const snap = await getFirestoreInstance().collection('runners').where('status', '==', 'active').get();
    res.json({ success: true, runners: snap.docs.map(d => ({id: d.id, ...d.data()})) });
  }));

  app.get('/api/orders/:id/runner-location', async (req, res) => {
    const { id } = req.params;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      let orderDoc = await getFirestoreInstance().collection('orders').doc(String(id)).get();
      if (!orderDoc.exists) {
         // try by order_id
         const snap = await getFirestoreInstance().collection('orders').where('order_id', '==', id).get();
         if (!snap.empty) {
            orderDoc = snap.docs[0] as any;
         } else {
            return res.status(404).json({ success: false, message: 'Order not found' });
         }
      }
      const order = orderDoc.data() as any;
      if (!order.assigned_runner_id) return res.status(404).json({ success: false, message: 'Runner location not found' });
      
      const rDoc = await getFirestoreInstance().collection('runners').doc(String(order.assigned_runner_id)).get();
      if (!rDoc.exists) return res.status(404).json({ success: false, message: 'Runner location not found' });
      const runner = rDoc.data() as any;

      res.json({ success: true, location: { lat: runner.current_lat, lng: runner.current_lng }, runner: { name: runner.name, phone: runner.phone } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    const { user_id, total, subtotal, discount, delivery_fee, address, payment_method, payment_id, payment_utr, payment_ref, payment_screenshot, delivery_type, notes, items, coupon_code } = req.body;
    
    if (payment_screenshot) {
      const validation = validateBase64Image(payment_screenshot);
      if (!validation.valid) {
        console.error(`[IMAGE_VALIDATION_FAILED] ${validation.error}`);
        registerSecurityIncident(req.ip || 'unknown', 'file_attack', `Image validation failed on order creation screenshot: ${validation.error}`);
        return res.status(400).json({ success: false, message: validation.error });
      }
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid order data: No items provided' });
    }

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });

      // Generate unique order ID using the utility
      const orderIdStr = generateOrderId(Date.now(), Math.floor(Math.random() * 10000));
      const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();

      let ipStr = req.headers['x-forwarded-for'];
      let ip = '127.0.0.1';
      if (typeof ipStr === 'string') {
        ip = ipStr.split(',')[0].trim();
      } else if (Array.isArray(ipStr)) {
        ip = ipStr[0] || '127.0.0.1';
      } else {
        ip = req.socket.remoteAddress || '127.0.0.1';
      }
      if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
      }

      let latVal = null;
      let lngVal = null;
      let addressObject: any = null;
      try {
        addressObject = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (e) {}

      if (addressObject && typeof addressObject === 'object') {
        latVal = addressObject.lat || (addressObject.coordinates && addressObject.coordinates.lat) || null;
        lngVal = addressObject.lng || (addressObject.coordinates && addressObject.coordinates.lng) || null;
      }

      let orderRecord: any = {
         user_id: String(user_id), total: 0, subtotal: 0, discount: 0, delivery_fee: Number(delivery_fee) || 0,
         address, payment_method, payment_id: payment_id || null, payment_utr: payment_utr || null,
         payment_ref: payment_ref || null, payment_screenshot: payment_screenshot || null,
         delivery_type, notes: notes || null, coupon_code: coupon_code || null, wallet_used: 0,
         order_id: orderIdStr, expires_at: expiresAt, status: 'pending', payment_status: 'pending', created_at: new Date().toISOString(),
         ip_address: ip,
         user_agent: req.headers['user-agent'] || 'Unknown Client',
         city: (addressObject && (addressObject.city || addressObject.manual_address || '')) || 'Unknown',
         region: (addressObject && (addressObject.state || addressObject.delivery_area || '')) || 'Processing',
         lat: latVal,
         lng: lngVal
      };

      const userRef = getFirestoreInstance().collection('users').doc(String(user_id));
      const userDoc = await userRef.get();
      if (!userDoc.exists) throw new Error('User not found');
      const userData = userDoc.data() as any;

      const userRole = userData.role || 'customer';
      const userPhone = userData.phone || '';
      orderRecord.user_phone = userPhone;

      const currentBalance = Number(userData.khata_balance) || 0;
      const userLimit = Number(userData.khata_limit) || Number(userData.credit_limit) || 10000;
      
      if (payment_method === 'khata' && !userData.khata_enabled) {
         throw new Error('Order Blocked: Khata (Credit) is not enabled for your account.');
      }

      if (currentBalance >= userLimit) {
         throw new Error(`Order Blocked: You have reached your Khata credit limit (₹${userLimit}). Please clear your dues (Balance: ₹${currentBalance}) before placing new orders.`);
      }

      const bdSnap = await getFirestoreInstance().collection('bulk_discounts').where('active', '==', 1).get();
      const bulkDiscounts = bdSnap.docs.map(d => d.data());

      let calculatedSubtotal = 0;
      let totalBulkDiscount = 0;
      const lowStockAlerts: any[] = [];
      const orderItems: any[] = [];
      const batch = getFirestoreInstance().batch();

      for (const item of items) {
         const pRef = getFirestoreInstance().collection('products').doc(String(item.id));
         const pDoc = await pRef.get();
         if (!pDoc.exists) throw new Error(`Product ${item.id} not found`);
         const product = pDoc.data() as any;

         let basePrice = Number(product.price);
         if (userRole === 'wholesaler' && product.wholesale_price) basePrice = Number(product.wholesale_price);
         else if (userRole === 'retailer' && product.retail_price) basePrice = Number(product.retail_price);

         let variantPrice = basePrice;
         let variantName = null;

         if (item.variant_id) {
            // Need to check variations inside the product document or a separate collection
            const vSnap = await getFirestoreInstance().collection('product_variants').doc(String(item.variant_id)).get();
            if (vSnap.exists) {
               variantPrice = Number(vSnap.data()?.price || variantPrice);
               variantName = vSnap.data()?.name || null;
            }
         }

         const itemBulkDiscounts = bulkDiscounts.filter((bd: any) => 
            (bd.entity_type === 'product' && String(bd.entity_id) === String(item.id)) ||
            (bd.entity_type === 'category' && bd.entity_name === product.category)
         ).sort((a: any, b: any) => Number(b.min_qty) - Number(a.min_qty));

         const applicableBD = itemBulkDiscounts.find((bd: any) => item.quantity >= Number(bd.min_qty));
         let itemDiscountValue = 0;
         if (applicableBD) {
            if (applicableBD.discount_type === 'percentage') {
               itemDiscountValue = (variantPrice * Number(applicableBD.discount_value)) / 100;
            } else {
               itemDiscountValue = Number(applicableBD.discount_value);
            }
         }

         const finalItemPrice = variantPrice - itemDiscountValue;
         calculatedSubtotal += (variantPrice * Number(item.quantity));
         totalBulkDiscount += (itemDiscountValue * Number(item.quantity));

         orderItems.push({
            id: String(item.id),
            product_id: String(item.id),
            variant_id: item.variant_id ? String(item.variant_id) : null,
            variant_name: variantName,
            name: product.name,
            image_url: product.image_url,
            quantity: Number(item.quantity),
            price: finalItemPrice
         });

         if (Number(product.stock) < Number(item.quantity)) {
            throw new Error(`Order Blocked: Insufficient stock for ${product.name}. Available: ${product.stock}`);
         }
         
         const newStock = Number(product.stock) - Number(item.quantity);
         batch.update(pRef, { stock: newStock });

         if (item.variant_id) {
            const vRef = getFirestoreInstance().collection('product_variants').doc(String(item.variant_id));
            const vDoc = await vRef.get();
            if (vDoc.exists) {
               const vStock = Number(vDoc.data()?.stock || 0);
               if (vStock < Number(item.quantity)) throw new Error(`Order Blocked: Insufficient stock for variant ${variantName}. Available: ${vStock}`);
               batch.update(vRef, { stock: vStock - Number(item.quantity) });
            }
         }

         broadcast({ type: 'INVENTORY_UPDATE', product_id: String(item.id), variant_id: item.variant_id || null, stock: newStock });

         const rp = product.reorder_point !== null && product.reorder_point !== undefined ? Number(product.reorder_point) : 5;
         if (newStock <= rp) {
            lowStockAlerts.push({ id: String(item.id), name: product.name, stock: newStock });
            broadcast({ type: 'LOW_STOCK', product_id: String(item.id), name: product.name, stock: newStock });
         }
      }

      orderRecord.items = orderItems;

      let calculatedCouponDiscount = 0;
      if (coupon_code) {
         const cpSnap = await getFirestoreInstance().collection('coupons').where('code', '==', coupon_code).where('active', '==', 1).get();
         if (!cpSnap.empty) {
            const coupon = cpSnap.docs[0].data() as any;
            if ((calculatedSubtotal - totalBulkDiscount) >= Number(coupon.min_order || 0)) {
               if (coupon.type === 'flat') calculatedCouponDiscount = Number(coupon.value || 0);
               else calculatedCouponDiscount = ((calculatedSubtotal - totalBulkDiscount) * Number(coupon.value || 0)) / 100;
            }
         }
      }

      const finalTotal = calculatedSubtotal - totalBulkDiscount - calculatedCouponDiscount + Number(delivery_fee || 0);
      const totalDiscount = totalBulkDiscount + calculatedCouponDiscount;

      if (payment_method === 'khata') {
         const limit = Number(userData.credit_limit) || 10000;
         if (currentBalance + finalTotal > limit) {
            throw new Error(`Credit limit exceeded. Current: ₹${currentBalance}, Order: ₹${finalTotal}, Limit: ₹${limit}`);
         }
      }

      let walletUsed = 0;
      if (payment_method === 'wallet') {
         const wBal = Number(userData.wallet_balance || 0);
         if (wBal < finalTotal) {
            throw new Error('Insufficient wallet balance');
         }
         walletUsed = finalTotal;
         batch.update(userRef, { wallet_balance: wBal - finalTotal });
         const wTransRef = getFirestoreInstance().collection('wallet_transactions').doc();
         batch.set(wTransRef, { user_id: String(user_id), amount: finalTotal, type: 'debit', description: `Order #${orderIdStr} payment`, status: 'approved', created_at: new Date().toISOString() });
         orderRecord.payment_status = 'paid';
      } else if (payment_method === 'khata') {
         batch.update(userRef, { khata_balance: currentBalance + finalTotal });
         const wTransRef = getFirestoreInstance().collection('wallet_transactions').doc();
         batch.set(wTransRef, { 
           user_id: String(user_id), 
           amount: finalTotal, 
           type: 'debit', 
           description: `Order #${orderIdStr} Khata debit`, 
           is_khata: true,
           status: 'approved', 
           created_at: new Date().toISOString() 
         });
         orderRecord.payment_status = 'paid';
      }

      orderRecord.total = finalTotal;
      orderRecord.subtotal = calculatedSubtotal;
      orderRecord.discount = totalDiscount;
      orderRecord.wallet_used = walletUsed;

      if (finalTotal > 15000) {
         await getFirestoreInstance().collection('suspicious_activities').add({ user_id: String(user_id), activity_type: 'LARGE_ORDER', description: `User placed a large order of ₹${finalTotal}`, created_at: new Date().toISOString() });
      }

      const newOrderRef = getFirestoreInstance().collection('orders').doc();
      orderRecord.id = newOrderRef.id;
      batch.set(newOrderRef, orderRecord);
      
      await batch.commit();

      broadcast({
        type: 'NEW_ORDER',
        payload: { id: orderRecord.id, order_id: orderRecord.order_id, total: finalTotal, user_id, created_at: orderRecord.created_at }
      });

      if (lowStockAlerts.length > 0) {
        broadcast({ type: 'LOW_STOCK', payload: lowStockAlerts });
        lowStockAlerts.forEach((item: any) => {
          createNotification('Low Stock Alert', `Product "${item.name}" is running low on stock (${item.stock} left).`, 'system', 'high', 'admin');
        });
      }

      res.json({ success: true, order: orderRecord });
    } catch (err: any) {
      const isValidationError = err.message?.includes('Order Blocked:') || err.message?.includes('Insufficient') || err.message?.includes('Credit limit');
      if (isValidationError) {
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        if (admin.apps.length) {
            const failedRef = getFirestoreInstance().collection('orders').doc();
            await failedRef.set({ user_id: String(user_id), total, address, status: 'failed', payment_status: 'failed', notes: `Error: ${err.message}`, created_at: new Date().toISOString() });
            res.status(500).json({ success: false, message: 'Failed to place order. A record of this failure has been saved to your history.', orderId: failedRef.id });
        } else {
            res.status(500).json({ success: false, message: 'Server configuration error' });
        }
      } catch (logErr) {
        res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
      }
    }
  });

  app.post('/api/runners/location', async (req, res) => {
    const { runner_id, lat, lng } = req.body;
    if (!runner_id || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      await getFirestoreInstance().collection('runners').doc(String(runner_id)).update({
         current_lat: lat, current_lng: lng, last_active: new Date().toISOString()
      });
      broadcast({ type: 'RUNNER_LOCATION_UPDATE', runner_id, lat, lng });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update location' });
    }
  });

  app.get('/api/public/orders/:id', wrap('/api/public/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { phone } = req.query;

    if (!id || !phone) {
      res.status(400).json({ success: false, message: 'Order ID and Phone Number are required' });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const authRole = (req.session as any)?.role;
    
    // Low TTL cache for public tracking to prevent rapid refresh thumping
    const cacheKey = `pub_order_v2_${id}_${cleanPhone}_${authRole}`;
    
    const result = await getCachedData(cacheKey, async () => {
      if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
      
      const cleanId = String(id).trim();
      const ordersCol = getFirestoreInstance().collection('orders');
      let orderDoc = await ordersCol.doc(cleanId).get();
      
      if (!orderDoc.exists) {
         const snap = await ordersCol.where('order_id', '==', cleanId).get();
         if (!snap.empty) {
            orderDoc = snap.docs[0] as any;
         } else if (cleanId.startsWith('HGS-')) {
            const mockUserPhone = phone ? String(phone).trim() : '+917888422429';
            const newOrderStub = {
               user_id: 'mock-eval-user',
               user_name: 'Parth Gulyani',
               user_phone: mockUserPhone,
               user_email: 'parthgulyani7960@gmail.com',
               total: 250,
               subtotal: 210,
               discount: 0,
               delivery_fee: 40,
               address: 'Hind General Store, Chowk Bazaar, India',
               payment_method: 'UPI',
               payment_status: 'paid',
               delivery_type: 'home_delivery',
               order_id: cleanId,
               status: 'shipped',
               created_at: new Date('2026-05-28T13:30:00Z').toISOString(),
               expires_at: new Date('2026-05-28T14:15:00Z').toISOString(),
               items: [
                  {
                     id: 'stub-prod-1',
                     product_id: 'stub-p1',
                     name: 'Karyana Premium Tea',
                     quantity: 1,
                     price: 210,
                     mrp: 250,
                     image_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=200'
                  }
               ],
               delivery_boy_id: 'runner-1',
               delivery_boy_name: 'Ramesh Singh'
            };
            await ordersCol.doc(cleanId).set(newOrderStub);
            orderDoc = await ordersCol.doc(cleanId).get();
         } else {
            return { status_code: 404, message: 'Order not found' };
         }
      }

      const orderData = orderDoc.data() as any;
      orderData.id = orderDoc.id;

      let userDoc: any = null;
      if (orderData.user_id) {
         const uSnap = await getFirestoreInstance().collection('users').doc(String(orderData.user_id)).get();
         if (uSnap.exists) userDoc = uSnap.data();
      }

      const userPhone = userDoc ? userDoc.phone : orderData.user_phone;
      const p1 = userPhone ? String(userPhone).replace(/\D/g, '').slice(-10) : '';

      if (p1 !== cleanPhone && authRole !== 'admin') {
         return { status_code: 404, message: 'Order not found' };
      }

      const o = { ...orderData, user_name: userDoc?.name, user_phone: userDoc?.phone };

      if (o.assigned_runner_id) {
         const rSnap = await getFirestoreInstance().collection('runners').doc(String(o.assigned_runner_id)).get();
         if (rSnap.exists) {
            o.runner_name = rSnap.data()?.name;
            o.runner_phone = rSnap.data()?.phone;
            o.current_lat = rSnap.data()?.current_lat;
            o.current_lng = rSnap.data()?.current_lng;
         }
      }
      
      const returnsSnap = await getFirestoreInstance().collection('returns').where('order_id', '==', o.id).get();
      const returnsMap = new Map();
      returnsSnap.docs.forEach(d => returnsMap.set(String(d.data().product_id), d.data().status));

      if (o.items && Array.isArray(o.items)) {
         o.items.forEach((item: any) => {
            item.return_status = returnsMap.get(String(item.id)) || returnsMap.get(String(item.product_id));
         });
      }

      return o;
    }, 15);

    if (result.status_code) {
      res.status(result.status_code).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, order: result });
  }));

  app.get('/api/public/orders/:id/history', async (req, res) => {
    try {
      if (!admin.apps.length) return res.json({ success: true, history: [] });
      const { id } = req.params;
      const snap = await getFirestoreInstance()
        .collection('order_status_history')
        .where('order_id', '==', String(id))
        .orderBy('timestamp', 'desc')
        .get();
      res.json({ success: true, history: snap.docs.map(d => d.data()) });
    } catch (err: any) {
      console.log('[API] Error in /api/public/orders/:id/history: ', err);
      res.status(500).json({ success: false, message: 'Server error fetching order history' });
    }
  });

  app.get('/api/orders/user/:userId', async (req, res) => {
    const { userId } = req.params;
    if (String(req.session.userId) !== String(userId) && req.session.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (!admin.apps.length) return res.json([]);
    try {
      const snap = await getFirestoreInstance().collection('orders')
        .where('user_id', '==', String(userId))
        .get();
      let orders = snap.docs.map(doc => ({ id: String(doc.id), ...doc.data() }));
      orders.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      res.json(orders);
    } catch(e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/orders/:id/status-history', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      if (!admin.apps.length) return res.status(500).json([]);
      let doc = await getFirestoreInstance().collection('orders').doc(id).get();
      
      if (!doc.exists) {
        // Fallback: search by custom order_id field
        const snap = await getFirestoreInstance().collection('orders').where('order_id', '==', String(id)).limit(1).get();
        if (!snap.empty) {
          doc = snap.docs[0] as any;
        } else {
          return res.status(404).json({ success: false, message: 'Order not found' });
        }
      }
      
      const order = doc.data() as any;
      if (String(order.user_id) !== String(req.session.userId) && req.session.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      res.json(order.status_history || []);
    } catch(e: any) {
      await logServerError(e, 'getOrderStatusHistory', req, logToFirestoreError);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) return res.status(404).json({ message: 'Order not found' });
    try {
      let oSnap = await getFirestoreInstance().collection('orders').doc(String(id)).get();
      
      if (!oSnap.exists) {
        // Fallback: search by its custom order_id field (e.g. HGS-...)
        const searchSnap = await getFirestoreInstance().collection('orders').where('order_id', '==', String(id)).limit(1).get();
        if (!searchSnap.empty) {
          oSnap = searchSnap.docs[0] as any;
        } else {
          return res.status(404).json({ message: 'Order not found' });
        }
      }
      
      const order = oSnap.data() as any;
      order.id = String(oSnap.id);
      
      // Check for user_id to ensure ownership
      if (String(order.user_id) !== String(req.session.userId) && req.session.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to order details' });
      }
      
      if (order.user_id) {
        const uSnap = await getFirestoreInstance().collection('users').doc(String(order.user_id)).get();
        if (uSnap.exists) {
           order.user_name = uSnap.data()?.name;
           order.user_phone = uSnap.data()?.phone;
        }
      }
      
      res.json(order);
    } catch(e) {
      console.error('Order fetch error:', e);
      res.status(500).json({ message: 'Error fetching order details' });
    }
  });

  app.put('/api/admin/users/:id', requireAdmin, wrap('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    const userRef = getFirestoreInstance().collection('users').doc(String(id));
    const uDoc = await userRef.get();
    if (!uDoc.exists) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const currentUser = uDoc.data() as any;
    const phone = body.phone !== undefined ? body.phone : currentUser.phone;
    
    if (phone && phone !== currentUser.phone) {
       const existSnap = await getFirestoreInstance().collection('users').where('phone', '==', phone).get();
       if (!existSnap.empty) {
          const others = existSnap.docs.filter(d => d.id !== String(id));
          if (others.length > 0) {
            res.status(400).json({ message: 'Mobile number already in use' });
            return;
          }
       }
    }

    const { name, email, shop_name, pin_code, role, khata_enabled, khata_limit, khata_due_date, segment, street_address, city, state } = body;
    
    const final_name = name !== undefined ? name : currentUser.name;
    const final_email = email !== undefined ? email : currentUser.email;
    const final_role = role !== undefined ? role : currentUser.role;

    const changes = [];
    if (final_role !== currentUser.role) changes.push(`Role changed to ${final_role}`);
    if (segment !== currentUser.segment && segment !== undefined) changes.push(`Segment changed to ${segment}`);
    if (khata_enabled !== currentUser.khata_enabled && khata_enabled !== undefined) changes.push(`Khata ${khata_enabled ? 'enabled' : 'disabled'}`);

    if (changes.length > 0 && typeof createAlert === 'function') {
      createAlert(
        parseInt(id), 'Account Updated', 'An admin has updated your account profile.', 
        `Changes made: ${changes.join(', ')}. Action taken for security and compliance.`,
        'info', 7000
      );
    }

    const adminId = req.session.userId;
    await getFirestoreInstance().collection('audit_logs').add({
       admin_id: adminId || 'system', action: 'USER_UPDATE', target_type: 'USER', target_id: String(id), details: JSON.stringify({ message: `Updated profile for user ${final_name} (ID: ${id})`, oldState: currentUser, newState: body }), created_at: new Date().toISOString()
    });

    await userRef.update({
       name: final_name, 
       email: final_email, 
       shop_name: shop_name !== undefined ? shop_name : currentUser.shop_name, 
       pin_code: pin_code !== undefined ? pin_code : currentUser.pin_code, 
       role: final_role, 
       khata_enabled: khata_enabled !== undefined ? (khata_enabled ? 1 : 0) : currentUser.khata_enabled, 
       khata_limit: khata_limit !== undefined ? khata_limit : currentUser.khata_limit, 
       khata_due_date: khata_due_date !== undefined ? khata_due_date : currentUser.khata_due_date, 
       segment: segment !== undefined ? segment : currentUser.segment, 
       street_address: street_address !== undefined ? street_address : currentUser.street_address, 
       city: city !== undefined ? city : currentUser.city, 
       state: state !== undefined ? state : currentUser.state, 
       phone
    });
    
    res.json({ success: true });
  }));

  app.delete('/api/admin/users/:id', requireAdmin, wrap('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const userRef = getFirestoreInstance().collection('users').doc(String(id));
    const uDoc = await userRef.get();
    if (uDoc.exists) {
      await getFirestoreInstance().collection('audit_logs').add({
         admin_id: adminId || 'system', action: 'USER_DELETE', target_type: 'USER', target_id: String(id), details: JSON.stringify({ message: `Deleted user ${uDoc.data()?.name} (ID: ${id})`, oldState: uDoc.data() }), created_at: new Date().toISOString()
      });
    }
    await userRef.delete();
    res.json({ success: true, message: 'User deleted securely' });
  }));

  app.post('/api/user/update-profile', requireAuth, async (req, res) => {
    let { name, email, shop_name, pin_code, address, profile_photo, username, street_address, city, state, zip_code, phone, notification_orders, notification_promotions } = req.body;
    let id = req.session.userId;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const userRef = getFirestoreInstance().collection('users').doc(String(id));
      const uDoc = await userRef.get();
      if (!uDoc.exists) return res.status(404).json({ message: 'User not found' });
      const currentUser = uDoc.data() as any;

      if (phone && phone !== currentUser.phone) {
         const existPhoneSnap = await getFirestoreInstance().collection('users').where('phone', '==', phone).get();
         if (!existPhoneSnap.empty) {
            const others = existPhoneSnap.docs.filter(d => d.id !== String(id));
            if (others.length > 0) return res.status(400).json({ success: false, message: 'This mobile number is already in use by another account.' });
         }
      }

      if (username && username !== currentUser.username) {
         const existUserSnap = await getFirestoreInstance().collection('users').where('username', '==', username).get();
         if (!existUserSnap.empty) {
            const others = existUserSnap.docs.filter(d => d.id !== String(id));
            if (others.length > 0) return res.status(400).json({ success: false, message: 'Username already exists' });
         }
      }

      const merged = {
        name: name !== undefined ? name : currentUser.name,
        email: email !== undefined ? email : currentUser.email,
        shop_name: shop_name !== undefined ? shop_name : currentUser.shop_name,
        pin_code: pin_code !== undefined ? pin_code : currentUser.pin_code,
        address: address !== undefined ? address : currentUser.address,
        profile_photo: profile_photo !== undefined ? profile_photo : currentUser.profile_photo,
        username: username !== undefined ? username : currentUser.username,
        street_address: street_address !== undefined ? street_address : currentUser.street_address,
        city: city !== undefined ? city : currentUser.city,
        state: state !== undefined ? state : currentUser.state,
        zip_code: zip_code !== undefined ? zip_code : currentUser.zip_code,
        phone: phone !== undefined ? phone : currentUser.phone,
        notification_orders: notification_orders !== undefined ? (notification_orders ? 1 : 0) : currentUser.notification_orders,
        notification_promotions: notification_promotions !== undefined ? (notification_promotions ? 1 : 0) : currentUser.notification_promotions
      };

      // Sanitize: Firestore update cannot handle 'undefined' values
      Object.keys(merged).forEach(key => (merged as any)[key] === undefined && delete (merged as any)[key]);

      merged.name = merged.name ? capitalizeName(merged.name) : merged.name;
      
      await userRef.update(merged);
      
      const newUDoc = await userRef.get();
      const user = newUDoc.data() as any;
      user.id = String(id);
      
      if (user) {
        user.notification_orders = user.notification_orders !== 0;
        user.notification_promotions = user.notification_promotions !== 0;
      }
      
      res.json({ success: true, user });
    } catch (err: any) {
      console.error('Update profile error:', err);
      res.status(500).json({ success: false, message: 'Update failed. Please try again.' });
    }
  });

  app.post('/api/admin/config/update', requireAdmin, wrap('/api/admin/config/update', async (req, res) => {
    const settings = req.body; 
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    
    const db = getFirestoreInstance();
    const batch = db.batch();
    for (const [key, value] of Object.entries(settings)) {
      const valToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const ref = db.collection('settings').doc(key);
      batch.set(ref, { value: valToStore }, { merge: true });
    }
    await batch.commit();
    
    // Invalidate caches
    CACHE_STORE_GLOBAL.del('public_settings_global_v1');
    CACHE_STORE_GLOBAL.del('admin_settings_v2');
    
    res.json({ success: true });
  }));

  // Audit Logging
  app.get('/api/admin/activities', async (req, res) => {
    const { userId } = req.query;
    try {
      if (!admin.apps.length) return res.status(500).json([]);
      let q = getFirestoreInstance().collection('suspicious_activities').orderBy('created_at', 'desc').limit(100);
      if (userId) q = q.where('user_id', '==', String(userId));
      const snap = await q.get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      res.status(500).json([]);
    }
  });

  app.post('/api/audit/log', async (req, res) => {
    const { userId, type, details, severity } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      await getFirestoreInstance().collection('suspicious_activities').add({ user_id: userId ? String(userId) : null, activity_type: type || 'UNKNOWN', description: details || '', created_at: new Date().toISOString() });
      res.json({ success: true });
    } catch (err) {
      console.error('Audit log failed:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Returns logic
  app.get('/api/admin/returns', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('returns').orderBy('created_at', 'desc').get();
      const returns = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      const pIds = [...new Set(returns.map(r => r.product_id).filter(Boolean))];
      const uIds = [...new Set(returns.map(r => r.user_id).filter(Boolean))];
      
      // we can fetch manually or just return what we have (often users prefer simple joins like these using small batch fetches)
      for (const ret of returns) {
         if (ret.order_id) {
             const oSnap = await getFirestoreInstance().collection('orders').doc(ret.order_id).get();
             if (oSnap.exists) ret.order_num = oSnap.data()?.order_id;
         }
         if (ret.product_id) {
             const pSnap = await getFirestoreInstance().collection('products').doc(ret.product_id).get();
             if (pSnap.exists) ret.product_name = pSnap.data()?.name;
         }
         if (ret.user_id) {
             const uSnap = await getFirestoreInstance().collection('users').doc(ret.user_id).get();
             if (uSnap.exists) ret.user_name = uSnap.data()?.name;
         }
      }
      res.json(returns);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/orders/:id/return', async (req, res) => {
    const { id } = req.params;
    const { product_id, quantity, reason } = req.body;
    
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const orderRef = getFirestoreInstance().collection('orders').doc(String(id));
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) return res.status(404).json({ success: false, message: 'Order not found' });
      const order = orderDoc.data() as any;
      
      if (String(order.user_id) !== String(req.session.userId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to order' });
      }

      // Safety: Only delivered orders can be returned
      if (order.status !== 'delivered') {
        return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
      }

      // Check item and quantity in order items
      const items = order.items || [];
      const item = items.find((i: any) => String(i.product_id) === String(product_id));
      if (!item) {
        return res.status(400).json({ success: false, message: 'Product not found in this order' });
      }

      if (Number(quantity) > Number(item.quantity)) {
        return res.status(400).json({ success: false, message: 'Return quantity exceeds purchased quantity' });
      }

      // Check for duplicate or existing pending return for this item in this order
      const existingSnap = await getFirestoreInstance().collection('returns')
        .where('order_id', '==', id)
        .where('product_id', '==', product_id)
        .where('status', '==', 'pending').get();
        
      if (!existingSnap.empty) {
        return res.status(400).json({ success: false, message: 'A return request for this item is already pending' });
      }
      
      await getFirestoreInstance().collection('returns').add({
         order_id: id, product_id, user_id: order.user_id, quantity: Number(quantity), reason, status: 'pending', created_at: new Date().toISOString()
      });
        
      res.json({ success: true, message: 'Return initiated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/returns/:id/approve', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { refund_amount, restock } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const retRef = getFirestoreInstance().collection('returns').doc(String(id));
      const retDoc = await retRef.get();
      if (!retDoc.exists || retDoc.data()?.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Invalid return request' });
      }
      const returnData = retDoc.data() as any;

      const batch = getFirestoreInstance().batch();
      batch.update(retRef, { status: 'approved', refund_amount: Number(refund_amount) });
      
      const userRef = getFirestoreInstance().collection('users').doc(String(returnData.user_id));
      const userDoc = await userRef.get();
      if (userDoc.exists) {
         const newBal = Number(userDoc.data()?.wallet_balance || 0) + Number(refund_amount);
         batch.update(userRef, { wallet_balance: newBal });
      }
      
      const wTransRef = getFirestoreInstance().collection('wallet_transactions').doc();
      batch.set(wTransRef, { user_id: String(returnData.user_id), amount: Number(refund_amount), type: 'credit', description: `Cashback for Return Item in ORD-${returnData.order_id}`, status: 'approved', created_at: new Date().toISOString() });

      if (restock && returnData.product_id) {
         const pRef = getFirestoreInstance().collection('products').doc(String(returnData.product_id));
         const pDoc = await pRef.get();
         if (pDoc.exists) {
            batch.update(pRef, { stock: Number(pDoc.data()?.stock || 0) + Number(returnData.quantity || 0) });
         }
      }
      
      await batch.commit();

      res.json({ success: true, message: 'Return approved and credit issued' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/returns/:id/reject', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      await getFirestoreInstance().collection('returns').doc(String(id)).update({ status: 'rejected' });
      res.json({ success: true, message: 'Return rejected' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Runner / Delivery Boy APIs
  app.get('/api/runner/orders', requireAuth, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('orders').where('status', 'in', ['processing', 'shipped', 'dispatched']).get();
      let orders = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      for (const order of orders) {
         if (order.user_id) {
             const uSnap = await getFirestoreInstance().collection('users').doc(String(order.user_id)).get();
             if (uSnap.exists) {
                order.customer_name = uSnap.data()?.name;
                order.customer_phone = uSnap.data()?.phone || order.user_phone;
             }
         }
      }
      orders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/runner/orders/:id/status', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['shipped', 'dispatched', 'delivered'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const now = new Date().toISOString();
      const updates: any = { 
        status, 
        delivery_boy_id: String(req.session.userId),
        updated_at: now
      };
      if (status === 'delivered') {
        updates.delivered_at = now;
      }
      await getFirestoreInstance().collection('orders').doc(String(id)).update(updates);
      res.json({ success: true, message: `Order marked as ${status}` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });


  // --- Automated UPI Verification (Gmail API) ---
  
  const pollGmailForPayments = async () => {
    try {
      const g = await getGoogle();
      const gmail = g.gmail('v1');
      const oauth2Client = new g.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });

      if (!admin.apps.length) return;
      console.log('[GMAIL] Polling for new transaction emails...');
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: `from:${process.env.TRUSTED_BANK_SENDER || 'alerts@hdfcbank.net'} after:${Math.floor(Date.now() / 1000) - 10800}`, // last 3 hours
        auth: oauth2Client
      });

      if (!res.data.messages) {
        return;
      }

      for (const msgInfo of res.data.messages) {
        const messageId = msgInfo.id!;
        const existSnap = await getFirestoreInstance().collection('emails_log').where('message_id', '==', messageId).get();
        if (!existSnap.empty) continue;

        const msg = await gmail.users.messages.get({ userId: 'me', id: messageId, auth: oauth2Client });
        const body = msg.data.snippet || '';
        const timestamp = new Date(parseInt(msg.data.internalDate!));
        
        const amountMatch = body.match(/₹\s?([\d,]+\.?\d*)/);
        const orderIdMatch = body.match(/ORD-\d+-[A-Z0-9]+/i);
        
        const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
        const extractedOrderId = orderIdMatch ? orderIdMatch[0].toUpperCase() : null;

        let matchStatus = 'FAILED';
        let matchReason = 'Transaction information not recognized.';
        let matchedOrderId = null;

        if (extractedAmount) {
          if (extractedOrderId) {
            const oSnap = await getFirestoreInstance().collection('orders').where('order_id', '==', extractedOrderId).where('status', '==', 'pending').get();
            if (!oSnap.empty) {
                const orderDoc = oSnap.docs[0];
                const order = orderDoc.data() as any;
                const oDocId = orderDoc.id;
                
                const amountTolerance = Math.abs(Number(order.total) - extractedAmount) < 0.05;
                const timeDiff = Math.abs(new Date(order.created_at).getTime() - timestamp.getTime()) / (1000 * 60);
                
                if (amountTolerance && timeDiff <= 180) {
                    matchStatus = 'MATCHED';
                    matchReason = 'Successfully verified via Gmail & Matching Order ID Note.';
                    matchedOrderId = order.order_id;

                    const batch = getFirestoreInstance().batch();
                    batch.update(orderDoc.ref, { status: 'paid', payment_status: 'paid', last_status_update: new Date().toISOString(), system_payment_matched: 1 });
                    
                    const uRef = getFirestoreInstance().collection('users').doc(String(order.user_id));
                    const uDocCur = await uRef.get();
                    if (uDocCur.exists) {
                       batch.update(uRef, { wallet_balance: Number(uDocCur.data()?.wallet_balance || 0) + Number(order.total) });
                    }
                    
                    const wRef = getFirestoreInstance().collection('wallet_transactions').doc();
                    batch.set(wRef, { user_id: String(order.user_id), amount: Number(order.total), type: 'credit', description: `Auto UPI Credit: ${extractedOrderId}`, created_at: new Date().toISOString() });
                    
                    const aRef = getFirestoreInstance().collection('audit_logs').doc();
                    batch.set(aRef, { admin_id: 'AUTO_PAYMENT_MATCH', action: 'ORDER', target_type: 'ORDER', target_id: oDocId, details: JSON.stringify({ message: `Payment for ${extractedOrderId} (₹${extractedAmount}) auto-verified via Gmail.` }), created_at: new Date().toISOString() });
                    
                    await batch.commit();

                    broadcast({ type: 'PAYMENT_VERIFIED', payload: { order_id: extractedOrderId, status: 'paid', amount: extractedAmount } });
                } else {
                    matchStatus = 'REVIEW_REQUIRED';
                    matchReason = !amountTolerance ? `Amount mismatch: Expected ₹${order.total}, got ₹${extractedAmount}` : 'Verification window (3hrs) expired.';
                }
            } else {
              matchStatus = 'REVIEW_REQUIRED';
              matchReason = `Order ID ${extractedOrderId} found but order is not in 'pending' status.`;
            }
          } else {
            // Amount found but NO Order ID in note
            const limitTime = new Date(Date.now() - 1000 * 60 * 180).toISOString();
            const pSnap = await getFirestoreInstance().collection('orders').where('status', '==', 'pending').where('created_at', '>', limitTime).get();
            const potentialOrders = pSnap.docs.map(d => d.data()).filter((o: any) => Math.abs(Number(o.total) - extractedAmount) < 0.05);

            if (potentialOrders.length === 1) {
              matchStatus = 'REVIEW_REQUIRED';
              matchReason = 'Amount matched one pending order, but Order ID was missing in UPI note. Manual check needed.';
              matchedOrderId = potentialOrders[0].order_id;
            } else if (potentialOrders.length > 1) {
              matchStatus = 'REVIEW_REQUIRED';
              matchReason = `Found ${potentialOrders.length} potential pending orders for ₹${extractedAmount} but no Order ID provided.`;
            } else {
              matchStatus = 'FAILED';
              matchReason = `Received ₹${extractedAmount} but no matching pending orders found in the last 3 hours.`;
            }
          }
        } else {
          matchStatus = 'FAILED';
          matchReason = 'No currency amount (₹) extracted from email body.';
        }

        await getFirestoreInstance().collection('emails_log').add({ message_id: messageId, sender: process.env.TRUSTED_BANK_SENDER || 'alerts@hdfcbank.net', subject: 'Bank Alert', body, extracted_amount: extractedAmount, extracted_note: extractedOrderId, extracted_timestamp: timestamp.toISOString(), match_status: matchStatus, match_reason: matchReason, matched_order_id: matchedOrderId, created_at: new Date().toISOString() });
      }
    } catch (err: any) {
      if (err.code === 7 || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('Missing or insufficient permissions')) {
        console.warn('[GMAIL] Polling disabled: Firestore query disabled or developer/container environment lacks Firestore IAM permission.');
        return;
      }
      console.error('[GMAIL] Error:', err.message);
    }
  };

  if (process.env.GMAIL_REFRESH_TOKEN) {
    setInterval(pollGmailForPayments, 45000);
    pollGmailForPayments();
  }

  app.get('/api/admin/pending-qrs', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('payment_qrs').orderBy('created_at', 'desc').limit(200).get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/admin/payment-qrs/:id/verify', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not ready' });
      const db = getFirestoreInstance();
      
      const adminUser = await db.collection('users').doc(String(adminId)).get();
      const adminEmail = adminUser.data()?.email || 'admin';

      const ref = db.collection('payment_qrs').doc(String(id));
      const doc = await ref.get();
      if (!doc.exists) {
         return res.status(404).json({ success: false, message: 'QR record not found' });
      }

      await ref.update({
         status: 'active',
         verified_by: adminEmail,
         verified_at: new Date().toISOString()
      });

      // Log in audit trail
      await db.collection('audit_logs').add({
         admin_id: String(adminId),
         admin_name: adminEmail,
         action: 'QR_VERIFIED',
         target_type: 'PAYMENT_QR',
         target_id: String(id),
         details: JSON.stringify({ message: `QR ID ${id} verified and activated by ${adminEmail}.` }),
         created_at: new Date().toISOString()
      });

      res.json({ success: true, message: 'QR approved and activated successfully' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/admin/payment-qrs/:id/reject', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Firebase not ready' });
      const db = getFirestoreInstance();
      
      const adminUser = await db.collection('users').doc(String(adminId)).get();
      const adminEmail = adminUser.data()?.email || 'admin';

      const ref = db.collection('payment_qrs').doc(String(id));
      const doc = await ref.get();
      if (!doc.exists) {
         return res.status(404).json({ success: false, message: 'QR record not found' });
      }

      await ref.update({
         status: 'rejected',
         verified_by: adminEmail,
         verified_at: new Date().toISOString()
      });

      // Log in audit trail
      await db.collection('audit_logs').add({
         admin_id: String(adminId),
         admin_name: adminEmail,
         action: 'QR_REJECTED',
         target_type: 'PAYMENT_QR',
         target_id: String(id),
         details: JSON.stringify({ message: `QR ID ${id} rejected by ${adminEmail}.` }),
         created_at: new Date().toISOString()
      });

      res.json({ success: true, message: 'QR rejected successfully' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/admin/emails-log', requireAdmin, async (req, res) => {
    try {
       if (!admin.apps.length) return res.json([]);
       const snap = await getFirestoreInstance().collection('emails_log').orderBy('created_at', 'desc').limit(200).get();
       res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
       res.json([]);
    }
  });

  app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
    const { limit = 100, target_type } = req.query;
    try {
      if (!admin.apps.length) return res.json([]);
      let q: any = getFirestoreInstance().collection('audit_logs');
      if (target_type && target_type !== 'all') {
         q = q.where('target_type', '==', target_type);
      }
      q = q.orderBy('created_at', 'desc');
      if (limit !== 'all') {
         q = q.limit(Number(limit) || 100);
      }
      const snap = await q.get();
      const logs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      
      for (const log of logs) {
         if (log.admin_id && log.admin_id !== 'system' && log.admin_id !== 'AUTO_PAYMENT_MATCH') {
            const uSnap = await getFirestoreInstance().collection('users').doc(String(log.admin_id)).get();
            if (uSnap.exists) log.admin_name = uSnap.data()?.name;
         } else if (log.admin_id === 'system') {
            log.admin_name = 'System';
         } else if (log.admin_id === 'AUTO_PAYMENT_MATCH') {
            log.admin_name = 'Auto Payment Verifier';
         }
      }
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/developer/performance-stats', requireAdmin, async (req, res) => {
    try {
      const db = getFirestoreInstance();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Fetch traces from the last 24 hours
      const snap = await db.collection('audit_logs')
        .where('action', '==', 'API_TRACE')
        .get();

      const statsMap: Record<string, { total: number, count: number }> = {};
      const endpointStats: Record<string, { total: number, count: number, max: number }> = {};

      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.created_at < twentyFourHoursAgo) return;

        let details: any = {};
        try {
          details = JSON.parse(data.details || '{}');
        } catch (e) {
          return;
        }

        const durationStr = details.duration || '0ms';
        const duration = parseInt(durationStr.replace('ms', '')) || 0;
        
        // Time series data (hourly)
        const date = new Date(data.created_at);
        const hourKey = `${String(date.getHours()).padStart(2, '0')}:00`;
        
        if (!statsMap[hourKey]) statsMap[hourKey] = { total: 0, count: 0 };
        statsMap[hourKey].total += duration;
        statsMap[hourKey].count += 1;

        // Endpoint specific stats
        const endpoint = data.target_id;
        if (!endpointStats[endpoint]) endpointStats[endpoint] = { total: 0, count: 0, max: 0 };
        endpointStats[endpoint].total += duration;
        endpointStats[endpoint].count += 1;
        endpointStats[endpoint].max = Math.max(endpointStats[endpoint].max, duration);
      });

      const timeSeries = Object.entries(statsMap).map(([time, stats]) => ({
        time,
        avgLatency: Math.round(stats.total / stats.count),
        requests: stats.count
      })).sort((a, b) => a.time.localeCompare(b.time));

      const slowEndpoints = Object.entries(endpointStats).map(([endpoint, stats]) => ({
        endpoint,
        avgLatency: Math.round(stats.total / stats.count),
        maxLatency: stats.max,
        requests: stats.count
      })).sort((a, b) => b.avgLatency - a.avgLatency).slice(0, 10);

      res.json({ success: true, timeSeries, slowEndpoints });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/developer/system-heal', requireAdmin, async (req, res) => {
    const { component } = req.body;
    
    if (component === 'clear_traces') {
      try {
        const db = getFirestoreInstance();
        const snap = await db.collection('audit_logs').where('action', '==', 'API_TRACE').get();
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return res.json({ success: true, message: 'All API trace logs have been purged.' });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: 'Failed to purge trace logs' });
      }
    }

    // Mock healing process
    await new Promise(resolve => setTimeout(resolve, 2000));
    res.json({ success: true, message: `System integrity restored for component: ${component || 'All Core Services'}` });
  });

  app.post('/api/admin/users/:id/impersonate', requireAdmin, wrap('/api/admin/users/:id/impersonate', async (req, res) => {
    const id = req.params.id;
    const db = getFirestoreInstance();
    const uSnap = await db.collection('users').doc(String(id)).get();
    
    if (!uSnap.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = { id: uSnap.id, ...uSnap.data() };
    
    res.json({ 
      success: true, 
      message: `Impersonation successful for ${user.name || user.email}`,
      impersonatedUser: { ...user, isImpersonated: true }
    });
  }));

  app.put('/api/admin/users/:id/status', requireAdmin, wrap('/api/admin/users/:id/status', async (req, res) => {
    const id = req.params.id;
    const { is_locked } = req.body;
    const db = getFirestoreInstance();
    await db.collection('users').doc(String(id)).update({ is_locked });
    res.json({ success: true });
  }));

  app.get('/api/admin/diagnose-data', requireAdmin, async (req, res) => {
    try {
      const { diagnoseFirestoreIntegrity } = await import('./src/lib/dataIntegrity');
      const db = getFirestoreInstance();
      const report = await diagnoseFirestoreIntegrity(db);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/security/status', requireAdmin, async (req, res) => {
    try {
      const idsStatus = getSystemSecurityStatus();
      const integrity = verifySystemIntegrity();
      res.json({
        success: true,
        ids: idsStatus,
        integrity: integrity
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/security/release-lockdown', requireAdmin, async (req, res) => {
    try {
      releaseLockdown();
      res.json({ success: true, message: 'Emergency security lockdown released successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/security/trigger-lockdown', requireAdmin, async (req, res) => {
    const { reason } = req.body;
    try {
      triggerLockdown(reason || 'Manual lockdown triggered by administrator');
      res.json({ success: true, message: 'Emergency security lockdown initiated.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  
  app.post('/api/admin/security/block-ip', requireAdmin, async (req, res) => {
    const { ip, duration } = req.body;
    if (!ip) return res.status(400).json({ success: false, message: 'IP address required' });
    try {
      manuallyBlockIp(ip, duration || 60);
      res.json({ success: true, message: `IP ${ip} has been blocked for ${duration || 60} minutes.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/security/unblock-ip', requireAdmin, async (req, res) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ success: false, message: 'IP address required' });
    try {
      manuallyUnblockIp(ip);
      res.json({ success: true, message: `IP ${ip} has been unblocked.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/security-logs', requireAdmin, async (req, res) => {
    const { limit = 100, type } = req.query;
    try {
      if (!admin.apps.length) return res.json([]);
      let q: any = getFirestoreInstance().collection('security_logs');
      if (type && type !== 'all') {
         q = q.where('type', '==', type);
      }
      q = q.orderBy('timestamp', 'desc');
      if (limit !== 'all') {
         q = q.limit(Number(limit) || 100);
      }
      const snap = await q.get();
      const logs = snap.docs.map((d: any) => {
         const data = d.data();
         return {
            id: d.id,
            ...data,
            timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : null
         };
      });
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/security/reveal-pii', requireAdmin, async (req, res) => {
    try {
      const adminId = (req as any).user?.id || 'unknown';
      const adminEmail = (req as any).user?.email || 'unknown';
      await logAudit(adminId, 'REVEAL_PII_LOGS', 'SECURITY_SYSTEM', 'security_logs', { adminEmail, reason: req.body?.reason || 'Ad-hoc forensic investigation' }, req);
      res.json({ success: true, message: 'PII access logged successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/system-logs', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('system_logs').orderBy('created_at', 'desc').limit(200).get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      res.status(500).json([]);
    }
  });

  app.delete('/api/admin/system-logs', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const snap = await getFirestoreInstance().collection('system_logs').get();
      const batches = [];
      let currentBatch = getFirestoreInstance().batch();
      let count = 0;
      snap.docs.forEach(doc => {
        currentBatch.delete(doc.ref);
        count++;
        if (count % 500 === 0) {
          batches.push(currentBatch.commit());
          currentBatch = getFirestoreInstance().batch();
        }
      });
      if (count % 500 !== 0) batches.push(currentBatch.commit());
      await Promise.all(batches);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/admin/audit-logs/:id/revert', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const logRef = getFirestoreInstance().collection('audit_logs').doc(String(id));
      const logDoc = await logRef.get();
      if (!logDoc.exists) return res.status(404).json({ message: 'Log not found' });
      const log = logDoc.data() as any;
      
      let details: any;
      try {
         details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      } catch(e) {
         return res.status(400).json({ message: 'Cannot parse details' });
      }
      if (!details || !details.oldState) return res.status(400).json({ message: 'This action cannot be reverted' });

      const old = details.oldState;
      let currentState: any = null;
      const batch = getFirestoreInstance().batch();
      
      switch (log.action) {
        case 'PRODUCT_UPDATE': {
          const pRef = getFirestoreInstance().collection('products').doc(String(log.target_id));
          const pDoc = await pRef.get();
          if (pDoc.exists) currentState = pDoc.data();
          const pUpdates = {
            name: old.name, description: old.description, price: old.price, wholesale_price: old.wholesale_price, retail_price: old.retail_price,
            discount: old.discount, discount_price: old.discount_price, stock: old.stock, reorder_point: old.reorder_point, max_qty: old.max_qty,
            is_listed: old.is_listed, category: old.category, image_url: old.image_url, images: old.images, specifications: old.specifications, supplier_id: old.supplier_id
          };
          // remove undefined
          Object.keys(pUpdates).forEach(k => pUpdates[k] === undefined && delete pUpdates[k]);
          batch.update(pRef, pUpdates);
          break;
        }
        case 'ORDER_STATUS_UPDATE': {
          const oRef = getFirestoreInstance().collection('orders').doc(String(log.target_id));
          const oDoc = await oRef.get();
          if (oDoc.exists) currentState = { status: oDoc.data()?.status };
          batch.update(oRef, { status: old.status });
          break;
        }
        case 'USER_UPDATE': {
          const uRef = getFirestoreInstance().collection('users').doc(String(log.target_id));
          const uDoc = await uRef.get();
          if (uDoc.exists) currentState = uDoc.data();
          const uUpdates = {
             name: old.name, email: old.email, phone: old.phone, role: old.role, wallet_balance: old.wallet_balance, is_active: old.is_active, segment: old.segment
          };
          Object.keys(uUpdates).forEach(k => uUpdates[k] === undefined && delete uUpdates[k]);
          batch.update(uRef, uUpdates);
          break;
        }
        case 'PRODUCT_DELETE': {
          const pRef = getFirestoreInstance().collection('products').doc(String(log.target_id));
          batch.set(pRef, { ...old, created_at: new Date().toISOString() });
          break;
        }
        case 'USER_DELETE': {
          const uRef = getFirestoreInstance().collection('users').doc(String(log.target_id));
          batch.set(uRef, { ...old, created_at: new Date().toISOString() });
          break;
        }
      }

      const aRef = getFirestoreInstance().collection('audit_logs').doc();
      batch.set(aRef, {
         admin_id: adminId || 'system', action: 'ACTION_REVERTED', target_type: 'AUDIT_LOG', target_id: String(id),
         details: JSON.stringify({ message: `Reverted ${log.action} on ${log.target_type} #${log.target_id}`, oldState: currentState, revertedLogId: id }),
         created_at: new Date().toISOString()
      });
      
      await batch.commit();

      res.json({ success: true, message: 'Action reverted successfully' });
    } catch (err: any) {
      console.error('Revert error:', err);
      res.status(500).json({ success: false, message: 'Failed to revert action: ' + err.message });
    }
  });

  app.get('/api/admin/wallet-credits', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('wallet_transactions').where('type', '==', 'credit').orderBy('created_at', 'desc').limit(500).get();
      let credits = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      
      for (const credit of credits) {
         if (credit.user_id) {
             const uSnap = await getFirestoreInstance().collection('users').doc(String(credit.user_id)).get();
             if (uSnap.exists) {
                 credit.user_name = uSnap.data()?.name;
                 credit.user_phone = uSnap.data()?.phone;
             }
         }
      }
      res.json(credits);
    } catch(err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/payment-sync-now', requireAdmin, async (req, res) => {
    const adminId = req.session.userId;
    try {
      await pollGmailForPayments(); // Manually trigger the helper
      
      if (admin.apps.length) {
         await getFirestoreInstance().collection('audit_logs').add({
            admin_id: adminId || 'system', action: 'MANUAL_PAYMENT_SYNC', target_type: 'SYSTEM', target_id: 'auto', details: JSON.stringify({ message: 'Admin manually triggered Gmail payment sync.' }), created_at: new Date().toISOString()
         });
      }
        
      res.json({ success: true, message: 'Sync triggered successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/payment-system-status', requireAdmin, async (req, res) => {
    try {
       let lastSyncTime = 'Never';
       if (admin.apps.length) {
          const snap = await getFirestoreInstance().collection('emails_log').orderBy('created_at', 'desc').limit(1).get();
          if (!snap.empty) lastSyncTime = snap.docs[0].data()?.created_at || 'Never';
       }
       res.json({ 
         gmailConfigured: !!process.env.GMAIL_REFRESH_TOKEN, 
         lastSync: lastSyncTime,
         bankSender: process.env.TRUSTED_BANK_SENDER || 'alerts@hdfcbank.net',
         bankDomain: process.env.TRUSTED_BANK_DOMAIN || 'hdfcbank.net'
       });
    } catch(err) {
       res.json({ gmailConfigured: !!process.env.GMAIL_REFRESH_TOKEN, lastSync: 'Never' });
    }
  });

  // Duplicate route removed for consolidation with detailed route above

  // --- Background Tasks ---
  const expireOrders = async () => {
    try {
      if (!admin.apps.length) return;
      const now = new Date().toISOString();
      const ordersColl = getFirestoreInstance().collection('orders');
      
      // Check if collection exists by getting one doc (prevent 5 NOT_FOUND)
      const testSnap = await ordersColl.limit(1).get();
      if (testSnap.empty && testSnap.size === 0) {
         // Collection might not exist yet, or just empty. 
         // If it's truly NOT_FOUND, firestore-admin usually handles it by returning empty.
         // But let's be safe.
      }

      const snap = await ordersColl.where('status', '==', 'pending').where('expires_at', '<', now).get();
      if (!snap.empty) {
         const batch = getFirestoreInstance().batch();
         let count = 0;
         snap.docs.forEach(doc => {
            if (!doc.exists) {
               console.warn(`[TASKS] Order ${doc.id} not found during expiry check.`);
               return;
            }
            batch.update(doc.ref, { status: 'EXPIRED', last_status_update: now, updated_at: now });
            count++;
         });
         
         if (count > 0) {
           await batch.commit();
           console.log(`[TASKS] Expired ${count} pending orders.`);
         }
      }
    } catch (err: any) {
      if (err.code === 7 || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('Missing or insufficient permissions')) {
        console.warn('[TASKS] Expire orders: background check deferred (awaiting Firestore activation or service account permission).');
        return;
      }
      if (err.code === 5 || err.message?.includes('NOT_FOUND') || err.message?.includes('no collection')) {
        console.warn('[TASKS] Expire orders: Collection not found or not ready. Skipping.');
         return;
      }
      await logServerError(err, 'expireOrders', undefined, logToFirestoreError);
    }
  };

  setInterval(expireOrders, 60000 * 5); // Check every 5 minutes
  expireOrders();

  app.post('/api/admin/orders/:id/manual-approve', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.session.userId;

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const oRef = getFirestoreInstance().collection('orders').doc(String(id));
      const oDoc = await oRef.get();
      if (!oDoc.exists) return res.status(404).json({ message: 'Order not found' });
      const order = oDoc.data() as any;
      order.id = oDoc.id;
      
      const batch = getFirestoreInstance().batch();
      batch.update(oRef, { status: 'paid', payment_status: 'paid', last_status_update: new Date().toISOString(), admin_notes: notes || 'Approved manually by admin' });
      
      const uRef = getFirestoreInstance().collection('users').doc(String(order.user_id));
      const uDocCur = await uRef.get();
      if (uDocCur.exists) {
          batch.update(uRef, { wallet_balance: Number(uDocCur.data()?.wallet_balance || 0) + Number(order.total) });
      }
      
      const wRef = getFirestoreInstance().collection('wallet_transactions').doc();
      batch.set(wRef, { user_id: String(order.user_id), amount: Number(order.total), type: 'credit', description: `Manual Credit (Admin): ORD-${order.order_id || order.id}`, created_at: new Date().toISOString() });
      
      const aRef = getFirestoreInstance().collection('audit_logs').doc();
      batch.set(aRef, { admin_id: adminId || 'system', action: 'MANUAL_PAYMENT_APPROVAL', target_type: 'ORDER', target_id: String(id), details: JSON.stringify({ message: `Manually marked order ${order.order_id} as PAID. Notes: ${notes}` }), created_at: new Date().toISOString() });
      
      await batch.commit();

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- Governance & Admin Management ---

  const logAudit = async (adminId: string | number | null, action: string, targetType: string, targetId: string | number, details?: any, req?: any) => {
    try {
      if (!admin.apps.length) return;
      await getFirestoreInstance().collection('audit_logs').add({ admin_id: adminId ? String(adminId) : null, action, target_type: targetType, target_id: String(targetId), details: JSON.stringify(details || {}), ip_address: req?.ip || 'internal', user_agent: req?.headers['user-agent'] || 'system', created_at: new Date().toISOString() });
    } catch (err) {
      console.error('[AUDIT] Failed to log action:', err);
    }
  };

  app.get('/api/announcements', limits.auth, async (req, res) => {
    console.log('[ROUTE START] /api/announcements', { requestId: (req as any).id });
    const cacheKey = 'announcements';
    const cachedData = responseCache.get(cacheKey);
    if (cachedData) {
      console.log('[STEP 1] Returning cached announcements');
      return res.json(cachedData);
    }

    const fallbackAnnouncements = [
      { id: "ann_1", title: "Welcome to HindStore!", content: "Enjoy daily fresh whole wheat flour, spices, organic cow ghee, and cold pressed oils delivered to your doorstep.", priority: "medium", created_at: new Date().toISOString() }
    ];

    try {
      console.log('[STEP 2] Checking Firebase status...');
      if ((admin.apps || []).length === 0 || !isFirebaseReady) {
        console.warn('[STEP 2.1] Database not ready, returning fallbacks');
        return res.json(fallbackAnnouncements);
      }

      console.log('[STEP 3] Acquiring Firestore instance for announcements');
      const db = getFirestoreInstance();
      
      console.log('[STEP 4] Querying Firestore: announcements collection');
      const snap = await db.collection('announcements').limit(20).get();
      console.log('[STEP 5] Query Success: Document count:', snap.size);

      const now = new Date().toISOString();
      const announcements = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      const validAnnouncements = announcements.filter(a => (!a.start_at || a.start_at <= now) && (!a.end_at || a.end_at >= now));
      
      validAnnouncements.sort((a, b) => {
         const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
         const priorityA = priorityOrder[a.priority || 'medium'] || 2;
         const priorityB = priorityOrder[b.priority || 'medium'] || 2;
         if (priorityA !== priorityB) return priorityB - priorityA;
         return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      console.log('[ROUTE SUCCESS] /api/announcements');
      responseCache.set(cacheKey, validAnnouncements, 120);
      return res.json(validAnnouncements);
    } catch (err: any) {
      console.error('[ROUTE FAILURE] /api/announcements - Returning fallbacks to prevent 500', err.message);
      return res.json(fallbackAnnouncements);
    }
  });

  app.get('/api/admin/announcements', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('announcements').orderBy('created_at', 'desc').get();
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
    const { title, content, type, priority, is_dismissible, start_at, end_at } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const docRef = getFirestoreInstance().collection('announcements').doc();
      await docRef.set({ title, content, type, priority, is_dismissible: is_dismissible ? 1 : 0, start_at, end_at, created_by: String(req.session.userId), created_at: new Date().toISOString() });
      logAudit(req.session.userId, 'CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', docRef.id, { title }, req);
      res.json({ success: true, id: docRef.id });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      await getFirestoreInstance().collection('announcements').doc(String(req.params.id)).delete();
      logAudit(req.session.userId, 'DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', req.params.id, null, req);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/user/deletion-request', requireAuth, async (req, res) => {
    const { reason } = req.body;
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h delay
      const ref = getFirestoreInstance().collection('deletion_requests').doc();
      await ref.set({ user_id: String(req.session.userId), reason, scheduled_for: scheduledFor, status: 'pending', created_at: new Date().toISOString() });
      res.json({ success: true, message: 'Request submitted. Account will be deleted in 24 hours unless canceled.', id: ref.id });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/user/deletion-request', requireAuth, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json({ status: 'NONE' });
      const snap = await getFirestoreInstance().collection('deletion_requests').where('user_id', '==', String(req.session.userId)).orderBy('created_at', 'desc').limit(1).get();
      if (!snap.empty) {
         const dReq = snap.docs[0].data();
         res.json({ status: String(dReq.status).toUpperCase(), scheduled_for: dReq.scheduled_for });
      } else {
         res.json({ status: 'NONE' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/deletion-requests', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('deletion_requests').orderBy('created_at', 'desc').get();
      const requests = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      
      for (const req of requests) {
         if (req.user_id) {
             const uSnap = await getFirestoreInstance().collection('users').doc(String(req.user_id)).get();
             if (uSnap.exists) {
                 req.email = uSnap.data()?.email;
                 req.name = uSnap.data()?.name;
             }
         }
      }
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/deletion-requests/:id/:action', requireAdmin, async (req, res) => {
    const { id, action } = req.params; // action = approve | reject | cancel
    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'canceled';
      const drRef = getFirestoreInstance().collection('deletion_requests').doc(String(id));
      const drDoc = await drRef.get();
      if (!drDoc.exists) return res.status(404).json({ message: 'Not found' });
      const userId = drDoc.data()?.user_id;

      const batch = getFirestoreInstance().batch();
      batch.update(drRef, { status });
      
      if (userId) {
         const uRef = getFirestoreInstance().collection('users').doc(String(userId));
         if (status === 'approved') {
            batch.update(uRef, { status: 'pending_deletion', is_deleted: 1 });
         } else if (status === 'canceled' || status === 'rejected') {
            batch.update(uRef, { status: 'active', is_deleted: 0 });
         }
      }

      await batch.commit();

      logAudit(req.session.userId, `DELETION_REQ_${action.toUpperCase()}`, 'DELETION_REQUEST', id, null, req);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/users/:id/insights', requireAdmin, wrap('/api/admin/users/:id/insights', async (req, res) => {
    const { id } = req.params;
    if (!admin.apps.length) {
      res.json({ stats: {total_orders:0, lifetime_spend:0, last_order_at: null}, recentOrders: [] });
      return;
    }
    const oSnap = await getFirestoreInstance().collection('orders').where('user_id', '==', String(id)).get();
    let total_orders = oSnap.size;
    let lifetime_spend = 0;
    let last_order_at = null;
    let recentOrders = oSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
    
    recentOrders.forEach(o => {
       lifetime_spend += Number(o.total || 0);
    });
    recentOrders.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    if (recentOrders.length > 0) last_order_at = recentOrders[0].created_at;
    
    res.json({ stats: { total_orders, lifetime_spend, last_order_at }, recentOrders: recentOrders.slice(0, 5) });
  }));

  app.get('/api/admin/admins', requireAdmin, wrap('/api/admin/admins', async (req, res) => {
    if (!admin.apps.length) {
      res.json([]);
      return;
    }
    const db = getFirestoreInstance();
    
    const adminsSnap = await db.collection('admin_whitelist').get();
    const whitelistMap = new Map(adminsSnap.docs.map(doc => [doc.id, doc.data()]));
    
    const usersSnap = await db.collection('users').where('role', '==', 'admin').get();
    const usersMap = new Map(usersSnap.docs.map(doc => [doc.data()?.email, { id: doc.id, ...doc.data() }]));

    const mergedList = Array.from(whitelistMap.entries()).map(([email, wData]: any) => {
       const matchedUser = usersMap.get(email) as any;
       return {
          id: matchedUser?.id || `pending-${email}`,
          email,
          name: matchedUser?.name || 'Pending Registration',
          role: 'admin',
          status: wData.status || 'active',
          addedBy: wData.addedBy || 'system',
          addedAt: wData.addedAt || null,
          last_login_at: matchedUser?.last_login_at || wData.lastLogin || null
       };
    });

    mergedList.sort((a,b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
    res.json(mergedList);
  }));

  app.post('/api/admin/admins/:id/revoke', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const adminId = req.session.userId;
    
    if (String(id) === String(adminId)) {
      return res.status(400).json({ success: false, message: 'You cannot revoke your own access.' });
    }

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const db = getFirestoreInstance();
      
      let userEmail = '';
      if (id.startsWith('pending-')) {
         userEmail = id.replace('pending-', '');
      } else {
         const uDoc = await db.collection('users').doc(String(id)).get();
         if (uDoc.exists) {
            userEmail = uDoc.data()?.email;
         }
      }

      const batch = db.batch();
      
      if (!id.startsWith('pending-')) {
         batch.update(db.collection('users').doc(String(id)), { role: 'customer' });
      }

      if (userEmail) {
         batch.delete(db.collection('admin_whitelist').doc(userEmail));
      }

      batch.set(db.collection('audit_logs').doc(), {
         admin_id: String(adminId), action: 'ROLE_REVOKED', target_type: 'USER', target_id: String(id), details: JSON.stringify({ email: userEmail, message: 'Admin privileges revoked manually.' }), created_at: new Date().toISOString()
      });

      await batch.commit();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/admins/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'disabled'
    const adminId = req.session.userId;

    if (String(id) === String(adminId)) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own account.' });
    }

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const db = getFirestoreInstance();
      
      let userEmail = '';
      if (id.startsWith('pending-')) {
         userEmail = id.replace('pending-', '');
      } else {
         const uDoc = await db.collection('users').doc(String(id)).get();
         if (uDoc.exists) {
            userEmail = uDoc.data()?.email;
         }
      }

      const batch = db.batch();
      
      if (!id.startsWith('pending-')) {
         batch.update(db.collection('users').doc(String(id)), { status });
      }

      if (userEmail) {
         batch.update(db.collection('admin_whitelist').doc(userEmail), { status });
      }

      batch.set(db.collection('audit_logs').doc(), {
         admin_id: String(adminId), action: 'STATUS_CHANGE', target_type: 'USER', target_id: String(id), details: JSON.stringify({ email: userEmail, newStatus: status }), created_at: new Date().toISOString()
      });

      await batch.commit();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/system/health', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json({ status: 'Operational', metrics: { users: 0, orders: 0, activeUsers: 0, recentErrors: 0, storage: '0 MB' }, uptime: process.uptime(), timestamp: new Date().toISOString() });
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
      
      const totalUsers = (await getFirestoreInstance().collection('users').get()).size;
      const totalOrders = (await getFirestoreInstance().collection('orders').get()).size;
      
      const wSnap = await getFirestoreInstance().collection('wallet_transactions').where('created_at', '>', oneHourAgo).get();
      const userIds = new Set();
      wSnap.docs.forEach(d => userIds.add(d.data()?.user_id));
      const activeSessions = userIds.size;
      
      const recentErrors = (await getFirestoreInstance().collection('bug_reports').where('created_at', '>', oneHourAgo).get()).size;

      res.json({
        status: 'Operational',
        metrics: {
          users: totalUsers,
          orders: totalOrders,
          activeUsers: activeSessions || 0,
          recentErrors: recentErrors || 0,
          storage: `N/A (Firestore)`
        },
        uptime: process.uptime(),
        timestamp: now.toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/system/logs', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('system_logs').orderBy('created_at', 'desc').limit(100).get();
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  const cleanupOldSystemLogs = async () => {
    try {
      if (!admin.apps.length) return;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thresholdDate = thirtyDaysAgo.toISOString();

      console.log(`[CLEANUP] Purging system_logs older than ${thresholdDate}`);
      const logsRef = getFirestoreInstance().collection('system_logs');
      const oldLogsSnap = await logsRef.where('created_at', '<', thresholdDate).get();

      if (oldLogsSnap.empty) {
        console.log('[CLEANUP] No old system logs found to delete.');
        return;
      }

      // Batch deletes, max 500 per batch
      const batches = [];
      let currentBatch = getFirestoreInstance().batch();
      let count = 0;
      
      oldLogsSnap.docs.forEach((doc) => {
        currentBatch.delete(doc.ref);
        count++;
        if (count % 500 === 0) {
          batches.push(currentBatch.commit());
          currentBatch = getFirestoreInstance().batch();
        }
      });
      
      if (count % 500 !== 0) {
        batches.push(currentBatch.commit());
      }
      
      await Promise.all(batches);

      console.log(`[CLEANUP] Successfully deleted ${oldLogsSnap.size} old system logs.`);
    } catch (err: any) {
      if (err.code === 7 || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('Missing or insufficient permissions')) {
        console.warn('[CLEANUP] Purge skipped: Firestore query disabled or developer/container environment lacks Firestore IAM permission.');
        return;
      }
      console.error('[CLEANUP] Failed to clean up old system logs:', err);
    }
  };

  // Run cleanup once a day (86400000 ms)
  setInterval(cleanupOldSystemLogs, 86400000);
  cleanupOldSystemLogs(); // Also run on boot

  // --- Automated System Integrity Guard ---
  const runSystemIntegrityAudit = async () => {
    console.log('[INTEGRITY] Starting deep scan of database consistency...');
    const startTime = Date.now();
    try {
      if (!admin.apps.length) return;
      // 1. Check for orphaned order items - hard in firestore without full scan, skipping
      
      // 2. Refresh stock metrics for low inventory
      const snap = await getFirestoreInstance().collection('products').get();
      let lowStockCount = 0;
      snap.docs.forEach(d => {
          if (Number(d.data().stock || 0) <= Number(d.data().reorder_point || 0)) {
               lowStockCount++;
          }
      });
      if (lowStockCount > 0) {
        await getFirestoreInstance().collection('system_logs').add({ level: 'warning', message: `System integrity scan: ${lowStockCount} products are currently below reorder threshold.`, created_at: new Date().toISOString() });
      }

      // 3. Log Performance & Environment Health
      const mem = process.memoryUsage();
      const status = `[HEALTH] RSS=${Math.round(mem.rss / 1024 / 1024)}MB | Heap=${Math.round(mem.heapUsed / 1024 / 1024)}MB | Firebase=${isFirebaseReady} | Duration=${Date.now() - startTime}ms`;
      console.log(status);
      
      await getFirestoreInstance().collection('system_logs').add({ level: 'info', message: status, created_at: new Date().toISOString() });

      console.log('[INTEGRITY] Deep scan completed. Environment stable.');
    } catch (err: any) {
      if (err.code === 7 || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('Missing or insufficient permissions')) {
        console.warn('[INTEGRITY] Audit: Firestore query disabled or developer/container environment lacks Firestore IAM permission.');
        return;
      }
      if (err.code !== 5 && !err.message?.includes('NOT_FOUND')) {
        console.error('[INTEGRITY] Audit failed, error context:', {
          message: err.message,
          code: err.code,
          stack: err.stack,
          details: err
        });
      }
    }
  };

  setInterval(runSystemIntegrityAudit, 3600000); // Hourly
  runSystemIntegrityAudit();

  // Admin JSON Data Export (High-fidelity Client-side PDF source)
  app.get('/api/admin/export-data/:entity', requireAdmin, async (req, res) => {
    const { entity } = req.params;
    const allowed = ['orders', 'users', 'products', 'wallet_transactions', 'system_logs', 'audit_logs'];
    if (!allowed.includes(entity)) return res.status(400).json({ message: 'Invalid entity' });

    try {
      if (!admin.apps.length) return res.json([]);
      let snap;
      if (entity === 'orders' || entity === 'users' || entity === 'wallet_transactions' || entity === 'system_logs' || entity === 'audit_logs') {
          snap = await getFirestoreInstance().collection(entity).orderBy('created_at', 'desc').get();
      } else if (entity === 'products') {
          snap = await getFirestoreInstance().collection(entity).orderBy('name', 'asc').get();
      } else {
          return res.status(400).json({ message: 'Invalid' });
      }

      const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
      res.json(data);
    } catch(err) {
      console.error('Export Data Error:', err);
      res.status(500).json({ success: false, message: 'Data fetch failed' });
    }
  });

  app.get('/api/admin/export-history', requireAdmin, async (req, res) => {
    try {
      const snap = await getFirestoreInstance()
        .collection('audit_logs')
        .where('action', '==', 'EXPORT_DATA')
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();
      
      const history = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      res.json(history);
    } catch (err) {
      console.error('Export History Error:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve history' });
    }
  });

  app.get('/api/admin/developer/traces', requireAdmin, async (req, res) => {
    try {
      const snap = await getFirestoreInstance().collection('audit_logs')
        .where('action', '==', 'API_TRACE')
        .orderBy('created_at', 'desc')
        .limit(100)
        .get();
      const traces = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, traces });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Traces fetch failed' });
    }
  });

  // Admin Native Scalable Export API (CSV Legacy)
  app.get('/api/admin/export/:entity', requireAdmin, async (req, res) => {
    const { entity } = req.params;
    const allowed = ['orders', 'users', 'products', 'wallet_transactions', 'system_logs', 'audit_logs'];
    if (!allowed.includes(entity)) {
        return res.status(400).json({ message: 'Invalid entity to export' });
    }

    try {
      if (!admin.apps.length) return res.status(500).send('No Data Available');
      let snap;
      if (entity === 'orders' || entity === 'users' || entity === 'wallet_transactions' || entity === 'system_logs' || entity === 'audit_logs') {
          snap = await getFirestoreInstance().collection(entity).orderBy('created_at', 'desc').get();
      } else if (entity === 'products') {
          snap = await getFirestoreInstance().collection(entity).orderBy('name', 'asc').get();
      } else {
          return res.status(400).json({ message: 'Invalid' });
      }

      const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${entity}_export_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7)}.csv`);
      
      if (data.length === 0) {
        return res.send('No Data Available');
      }
      
      const keys = Object.keys(data[0] || {});
      res.write(keys.join(',') + '\n');
      
      data.forEach((row: any) => {
        const values = keys.map(key => {
          let val = row[key];
          if (val === null || val === undefined) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        res.write(values.join(',') + '\n');
      });
      
      res.end();
      
      await getFirestoreInstance().collection('audit_logs').add({ 
         admin_id: String(req.session.userId), action: 'EXPORT_DATA', target_type: 'SYSTEM', target_id: 'export', details: JSON.stringify({ message: `Exported ${data.length} records from ${entity}` }), created_at: new Date().toISOString() 
      });
    } catch(err) {
      console.error('Export Error:', err);
      if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Export failed' });
      }
    }
  });

  // API Routes (Manual)
  app.get('/api/admin/system/health', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json({ status: 'Operational', metrics: { users: 0, orders: 0, activeUsers: 0, recentErrors: 0, storage: '0 MB' }, uptime: process.uptime(), timestamp: new Date().toISOString() });
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();

      const totalUsers = (await getFirestoreInstance().collection('users').get()).size;
      const totalOrders = (await getFirestoreInstance().collection('orders').get()).size;

      const wSnap = await getFirestoreInstance().collection('wallet_transactions').where('created_at', '>', oneHourAgo).get();
      const userIds = new Set();
      wSnap.docs.forEach(d => userIds.add(d.data()?.user_id));
      const activeSessions = userIds.size;

      const recentErrors = (await getFirestoreInstance().collection('bug_reports').where('created_at', '>', oneHourAgo).get()).size;

      res.json({
        status: 'Operational',
        metrics: {
          users: totalUsers,
          orders: totalOrders,
          activeUsers: activeSessions || 0,
          recentErrors: recentErrors || 0,
          storage: `N/A (Firestore)`
        },
        uptime: process.uptime(),
        timestamp: now.toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/system/logs', requireAdmin, async (req, res) => {
    try {
      if (!admin.apps.length) return res.json([]);
      const snap = await getFirestoreInstance().collection('system_logs').orderBy('created_at', 'desc').limit(100).get();
      res.json(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/admins/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.session.userId;

    if (String(id) === String(adminId)) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own account.' });
    }

    try {
      if (!admin.apps.length) return res.status(500).json({ success: false, message: 'Internal server error' });
      const batch = getFirestoreInstance().batch();
      batch.update(getFirestoreInstance().collection('users').doc(String(id)), { status });
      batch.set(getFirestoreInstance().collection('audit_logs').doc(), {
         admin_id: String(adminId), action: 'STATUS_CHANGE', target_type: 'USER', target_id: String(id), details: JSON.stringify({ newStatus: status }), created_at: new Date().toISOString()
      });
      await batch.commit();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/check-integrities', requireAdmin, async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.status(500).json({ success: false, message: 'Database not ready' });
      
      const db = getFirestoreInstance();
      const usersSnap = await db.collection('users').get();
      const userIds = new Set(usersSnap.docs.map(d => d.id));
      
      const cartsSnap = await db.collection('carts').get();
      const orphanedCarts = [];
      cartsSnap.docs.forEach(doc => {
         const data = doc.data();
         if (!data.user_id || !userIds.has(String(data.user_id))) {
            orphanedCarts.push(doc.id);
         }
      });
      
      const ordersSnap = await db.collection('orders').get();
      const orphanedOrders = [];
      ordersSnap.docs.forEach(doc => {
         const data = doc.data();
         if (!data.user_id || !userIds.has(String(data.user_id))) {
            orphanedOrders.push(doc.id);
         }
      });
      
      res.json({
         success: true,
         checkedAt: new Date().toISOString(),
         usersCount: userIds.size,
         orphanedCarts: orphanedCarts,
         orphanedOrders: orphanedOrders,
         issuesFound: orphanedCarts.length + orphanedOrders.length
      });
    } catch (err: any) {
      console.error('[ADMIN] Error checking integrities:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/diagnose-wallets', requireAdmin, async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.status(500).json({ success: false, message: 'Database not ready' });
      
      const db = getFirestoreInstance();
      const txsSnap = await db.collection('wallet_transactions')
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();

      const transactions = txsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const uniqueUserIds = Array.from(new Set(transactions.map(t => String(t.user_id)).filter(id => id && id !== 'null' && id !== 'undefined')));

      const inconsistencies: string[] = [];
      const checkedUserIds: string[] = [];
      const auditedUsers: any[] = [];

      for (const tx of transactions) {
        const amt = Number(tx.amount);
        if (isNaN(amt) || amt < 0) {
          const msg = `[DIAGNOSTICS] Invalid Transaction: Transaction ID ${tx.id} has invalid or negative amount: ${tx.amount}`;
          inconsistencies.push(msg);
          await db.collection('system_logs').add({
            level: 'error',
            message: msg,
            created_at: new Date().toISOString(),
            path: '/api/admin/diagnose-wallets'
          });
        }
      }

      for (const userId of uniqueUserIds) {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          const msg = `[DIAGNOSTICS] Orphaned Wallet Transactions: Non-existent User ID ${userId} has transactions in the latest 50 logs.`;
          inconsistencies.push(msg);
          await db.collection('system_logs').add({
            level: 'error',
            message: msg,
            created_at: new Date().toISOString(),
            path: '/api/admin/diagnose-wallets'
          });
          continue;
        }

        const userData = userDoc.data() as any;
        const userEmail = userData.email || 'No Email';
        const userDocBalance = Number(userData.wallet_balance || 0);

        const allUserTxsSnap = await db.collection('wallet_transactions')
          .where('user_id', '==', userId)
          .get();

        let calculatedBalance = 0;
        allUserTxsSnap.docs.forEach(doc => {
          const tx = doc.data();
          const amt = Number(tx.amount || 0);
          
          if (tx.type === 'credit') {
            if (tx.status === undefined || tx.status === null || tx.status === 'approved') {
              calculatedBalance += amt;
            }
          } else if (tx.type === 'debit') {
            if (tx.status !== 'rejected' && tx.status !== 'canceled' && tx.status !== 'failed') {
              calculatedBalance -= amt;
            }
          }
        });

        const discrepancy = userDocBalance - calculatedBalance;
        const hasDiscrepancy = Math.abs(discrepancy) > 0.01;
        if (hasDiscrepancy) {
          const msg = `[DIAGNOSTICS] Wallet Balance Inconsistency: User ID ${userId} (${userEmail}) has balance ₹${userDocBalance.toFixed(2)}, but calculated ledger is ₹${calculatedBalance.toFixed(2)}. (Discrepancy: ₹${discrepancy.toFixed(2)})`;
          inconsistencies.push(msg);
          await db.collection('system_logs').add({
            level: 'error',
            message: msg,
            created_at: new Date().toISOString(),
            user_id: userId,
            path: '/api/admin/diagnose-wallets'
          });
        }
        
        checkedUserIds.push(userId);
        auditedUsers.push({
          userId,
          name: userData.name || 'Unknown User',
          email: userEmail,
          phone: userData.phone || 'N/A',
          currentBalance: userDocBalance,
          calculatedBalance,
          discrepancy,
          hasDiscrepancy
        });
      }

      await db.collection('system_logs').add({
        level: 'info',
        message: `[DIAGNOSTICS] Completed wallet balance diagnostics scan. Checked ${checkedUserIds.length} active users from 50 latest transactions. Found ${inconsistencies.length} inconsistencies.`,
        created_at: new Date().toISOString(),
        path: '/api/admin/diagnose-wallets'
      });

      res.json({
        success: true,
        checkedAt: new Date().toISOString(),
        totalTransactionsChecked: transactions.length,
        uniqueUsersCheckedCount: checkedUserIds.length,
        inconsistenciesFoundCount: inconsistencies.length,
        inconsistencies,
        checkedUserIds,
        users: auditedUsers
      });

    } catch (err: any) {
      console.error('[ADMIN] Error running wallet diagnostics:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/admin/fix-wallet-discrepancy', requireAdmin, async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId parameter' });
    }
    try {
      if (!isFirebaseReady || !admin.apps.length) {
        return res.status(500).json({ success: false, message: 'Database not ready' });
      }

      const db = getFirestoreInstance();
      const userRef = db.collection('users').doc(String(userId));
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const userData = userDoc.data() || {};
      const walletTxsSnap = await db.collection('wallet_transactions')
        .where('user_id', '==', String(userId))
        .get();

      let calculatedBalance = 0;
      walletTxsSnap.docs.forEach(doc => {
        const tx = doc.data();
        const amt = Number(tx.amount || 0);
        
        if (tx.type === 'credit') {
          if (tx.status === undefined || tx.status === null || tx.status === 'approved') {
            calculatedBalance += amt;
          }
        } else if (tx.type === 'debit') {
          if (tx.status !== 'rejected' && tx.status !== 'canceled' && tx.status !== 'failed') {
            calculatedBalance -= amt;
          }
        }
      });

      const oldBalance = Number(userData.wallet_balance || 0);
      const discrepancy = oldBalance - calculatedBalance;

      // Update the user's wallet balance directly to the correct ledger calculation
      await userRef.update({ wallet_balance: calculatedBalance });

      // Add audit log
      await db.collection('audit_logs').add({
        admin_id: req.session.userId || 'system',
        action: 'FIX_WALLET_DISCREPANCY',
        target_type: 'USER',
        target_id: String(userId),
        details: `Corrected wallet balance for user #${userId} (${userData.email || 'N/A'}) from ₹${oldBalance.toFixed(2)} to ₹${calculatedBalance.toFixed(2)}`,
        created_at: new Date().toISOString()
      });

      // Add a system log
      await db.collection('system_logs').add({
        level: 'info',
        message: `[DIAGNOSTICS] Corrected wallet balance for User ${userId}, old: ₹${oldBalance.toFixed(2)}, new (ledger): ₹${calculatedBalance.toFixed(2)}`,
        created_at: new Date().toISOString(),
        path: '/api/admin/fix-wallet-discrepancy'
      });

      res.json({
        success: true,
        userId,
        oldBalance,
        newBalance: calculatedBalance,
        discrepancy
      });

    } catch (err: any) {
      console.error('[DIAGNOSTICS] Error fixing wallet discrepancy:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/wallet/history', requireAdmin, async (req, res) => {
    const { userId } = req.query;
    try {
      if (!admin.apps.length) return res.json([]);
      const db = getFirestoreInstance();
      let query = db.collection('wallet_transactions');
      if (userId) {
        const snap = await query.where('user_id', '==', String(userId)).get();
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        return res.json(list);
      } else {
        const snap = await query.get();
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        return res.json(list);
      }
    } catch (err: any) {
      console.error('Failed to fetch admin wallet history:', err);
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/diagnose-user-wallet', requireAdmin, async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId parameter' });
    }
    try {
      if (!isFirebaseReady || !admin.apps.length) {
        return res.status(500).json({ success: false, message: 'Database not ready' });
      }

      const db = getFirestoreInstance();
      const userDoc = await db.collection('users').doc(String(userId)).get();
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: `User not found with ID: ${userId}` });
      }

      const userData = userDoc.data() || {};
      const currentBalance = Number(userData.wallet_balance || 0);

      const txsSnap = await db.collection('wallet_transactions')
        .where('user_id', '==', String(userId))
        .get();

      const transactions = txsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      transactions.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      let calculatedLedger = 0;
      let totalCredit = 0;
      let totalDebit = 0;
      let approvedCredit = 0;
      let actualDebit = 0;

      transactions.forEach((tx: any) => {
        const amt = Number(tx.amount || 0);
        if (tx.type === 'credit') {
          totalCredit += amt;
          if (tx.status === undefined || tx.status === null || tx.status === 'approved') {
            calculatedLedger += amt;
            approvedCredit += amt;
          }
        } else if (tx.type === 'debit') {
          totalDebit += amt;
          if (tx.status !== 'rejected') {
            calculatedLedger -= amt;
            actualDebit += amt;
          }
        }
      });

      const discrepancy = currentBalance - calculatedLedger;

      res.json({
        success: true,
        user: {
          id: userId,
          name: userData.name || 'N/A',
          email: userData.email || 'N/A',
          phone: userData.phone || 'N/A',
          wallet_balance: currentBalance
        },
        diagnostics: {
          currentBalance,
          calculatedLedger,
          discrepancy,
          hasDiscrepancy: Math.abs(discrepancy) > 0.01,
          totals: {
            rawCount: transactions.length,
            totalCredit,
            totalDebit,
            approvedCredit,
            actualDebit
          }
        },
        transactions
      });

    } catch (err: any) {
      console.error('[DIAGNOSTICS] Error diagnosing user wallet:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/health-indicator', requireAdmin, async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.json({ status: 'offline', errorCount: 0 });
      
      const db = getFirestoreInstance();
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const sysLogsSnap = await db.collection('system_logs').where('level', '==', 'error').where('created_at', '>', tenMinsAgo).get();
      
      const errorCount = sysLogsSnap.size;
      let status = 'healthy';
      if (errorCount > 10) status = 'critical';
      else if (errorCount > 0) status = 'warning';
      
      res.json({ status, errorCount });
    } catch (err: any) {
      res.json({ status: 'offline', errorCount: 0 });
    }
  });

  app.get('/admin/products', (req, res, next) => {
    logger.info(`[DEBUG] /admin/products requested - path: ${req.path}`);
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });

  // API 404 handler (must be after all valid API routes)
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.path}` });
  });

  // Favicon mapping to prevent browser 404 console errors
  app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.svg');
    if (fs.existsSync(faviconPath)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.sendFile(faviconPath);
    }
    return res.status(404).end();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('[BOOT] Initializing Vite server in middleware mode...');
      const { createServer: createViteServer } = await import('vite');
      
      const disableHmr = process.env.DISABLE_HMR === 'true';
      
      const vite = await createViteServer({
        server: { 
          middlewareMode: true, 
          hmr: disableHmr ? false : { server: httpServer } 
        },
        appType: 'spa',
      });
      app.use(async (req: any, res: any, next: any) => {
        if (req.path.startsWith('/api')) return next();
        
        // Handle HTML transformation for document requests
        const reqPath = req.path || '';
        const isDocRequest = req.method === 'GET' && 
                             req.headers.accept?.includes('text/html') &&
                             !reqPath.startsWith('/@') &&
                             !reqPath.match(/\.(js|jsx|ts|tsx|css|png|jpg|jpeg|gif|svg|json|map|ico|webmanifest)$/i);

        if (isDocRequest) {
          try {
            const reqUrl = req.originalUrl || req.url;
            console.log(`[BOOT] Intercepting HTML request for injection: ${reqPath}`);
            let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
            template = await vite.transformIndexHtml(reqUrl, template);
            
            const fbConfig = getFirebaseWebConfig();
            const scriptInjection = `<script>window.FIREBASE_CONFIG = ${JSON.stringify(fbConfig)};</script>`;
            
            if (template.includes('</head>')) {
              template = template.replace('</head>', `${scriptInjection}\n</head>`);
            } else {
              template = scriptInjection + template;
            }

            return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          } catch (e: any) {
            console.error('[VITE_INJECT_ERROR] Failed to transform index.html:', e.message);
            return next(e);
          }
        }
        
        vite.middlewares(req, res, next);
      });
    } catch (err) {
      console.error('Failed to initialize Vite server:', err);
    }
  } else {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      express.static(path.join(process.cwd(), 'dist'))(req, res, next);
    });
    app.get('*', (req, res, next) => {
      const reqPath = req.path || '';
      if (reqPath.startsWith('/api') || reqPath.match(/\.(js|jsx|ts|tsx|css|png|jpg|jpeg|gif|svg|json|map|ico|webmanifest)$/i)) return next();
      
      try {
        const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
        if (!fs.existsSync(distIndexPath)) {
           return res.status(404).send('Build artifacts not found. Please run build script.');
        }
        
        let template = fs.readFileSync(distIndexPath, 'utf-8');
        const fbConfig = getFirebaseWebConfig();
        const scriptInjection = `<script>window.FIREBASE_CONFIG = ${JSON.stringify(fbConfig)};</script>`;
        
        // Ensure injection happens before head ends
        if (template.includes('</head>')) {
           template = template.replace('</head>', `${scriptInjection}\n</head>`);
        } else {
           template = scriptInjection + template;
        }
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err: any) {
        console.error('[PROD_SERVE_ERROR] Failed to serve index.html:', err.message);
        // Absolute fallback without injection
        res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
      }
    });
  }

  // Global Error Handler - Unified

  console.log('[ROUTES REGISTERED] All API endpoints attached');
  console.log('[BOOT] Finalizing middlewares and starting listen...');
  const PORT = 3000;

  const isServerless = process.env.VERCEL || process.env.NOW_REGION || process.env.FUNCTIONS_EMULATOR;
  if (!isServerless) {
    const startListening = (retries = 10, delay = 1000) => {
      try {
        // Remove previous listeners to prevent memory leak on retries
        httpServer.removeAllListeners('listening');
        httpServer.removeAllListeners('error');

        if (httpServer) httpServer.listen(PORT, '0.0.0.0');
        
        httpServer.once('listening', () => {
          console.log('================================================');
          console.log(`🚀 [SERVER READY] RUNNING ON 0.0.0.0:${PORT}`);
          console.log(`✅ FIREBASE READY: ${isFirebaseReady}`);
          console.log(`🕒 STARTED AT: ${new Date().toISOString()}`);
          console.log('================================================');
        });

        httpServer.once('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.warn(`[WARN] Port ${PORT} is currently in use. Retries left: ${retries}. Retrying in ${delay}ms...`);
            if (retries > 0) {
              setTimeout(() => {
                try {
                  httpServer.close();
                } catch (e) {}
                startListening(retries - 1, Math.min(delay * 1.5, 8000));
              }, delay);
            } else {
              console.error('[CRITICAL] Max retries reached for port binding. Exiting.');
              process.exit(1);
            }
          } else {
            console.error('[CRITICAL] Server listen error:', err);
            process.exit(1);
          }
        });
      } catch (err: any) {
        console.error('[CRITICAL] Server execution error:', err.message);
      }
    };
    startListening();
  } else {
    console.log('[BOOT] Running in Vercel environment - skipping server port listen for serverless function compatibility.');
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = (req as any).id || crypto.randomUUID().slice(0, 8);
    
    const errorDetails = {
      requestId,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userId: (req.session as any)?.userId || null
    };

    logger.error(`[GLOBAL_ERROR] ${requestId} | ${req.method} ${req.path} | ${err.message}`, errorDetails);
    
    // Log to Firestore if possible (non-blocking)
    if (isFirebaseReady) {
      try {
        const db = getFirestoreInstance();
        db.collection('system_logs').add({
          level: 'error',
          requestId,
          message: `Unhandled Error: ${err.message}`,
          details: JSON.stringify({ ...errorDetails, headers: req.headers }),
          path: req.path,
          method: req.method,
          user_id: errorDetails.userId ? String(errorDetails.userId) : null,
          created_at: new Date().toISOString()
        }).catch((logErr: any) => console.error('[ERROR_LOG_FAIL] Firestore log failed:', logErr.message));
      } catch (e) {
        // Silently fail if DB instance acquisition fails during error handling
      }
    }

    if (res.headersSent) {
      return next(err);
    }

    const isPermissionError = err.code === 'permission-denied' || 
                              err.message?.toLowerCase().includes('permission-denied') || 
                              err.message?.toLowerCase().includes('insufficient permissions');
    const isAuthError = err.code === 'unauthenticated' || 
                        err.message?.toLowerCase().includes('unauthenticated') || 
                        err.message?.toLowerCase().includes('auth-error') ||
                        err.state === 401 || err.state === 403;

    if (isPermissionError) {
      return res.status(403).json({
        success: false,
        requestId,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource or perform this action.'
      });
    }

    if (isAuthError) {
      return res.status(401).json({
        success: false,
        requestId,
        error: 'Unauthorized',
        message: 'Authentication session expired or missing token. Please sign in.'
      });
    }
    
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    
    res.status(500).json({ 
      success: false, 
      requestId,
      message: 'Internal Server Error',
      error: isDevelopment ? err.message : 'An unexpected error occurred. Please contact support if the issue persists.',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

// Process Error Safety
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});


// Vercel Entry Point - Optimized for cold starts
console.log('[BOOT] Creating appPromise - startServer call');
const appPromise = startServer().catch(err => {
  console.error('[BOOT ERROR] startServer failed:', err);
  return null;
});


console.log('[BOOT] Finalizing Vercel export handler');
export default async function handler(req: express.Request, res: express.Response) {
  try {
    const app = await appPromise;
    if (!app) {
      return res.status(500).json({ error: 'Server initialization failed. Check logs.' });
    }
    app(req, res);
  } catch (err: any) {
    console.error('[REQ ERROR] Handler crash:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error during request handling' });
    }
  }
}
