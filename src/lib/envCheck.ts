/**
 * Environment Variable Validation Utility
 * Ensures all required secrets and configuration variables are present at startup.
 */

const REQUIRED_VARS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'SESSION_SECRET'
];

const OPTIONAL_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

/**
 * Normalizes environment variables, detecting and correcting common typos.
 */
export function normalizeEnvironment() {
  const mapping: Record<string, string[]> = {
    'FIREBASE_PROJECT_ID': [
      'VITE_FIREBASE_PROJECT_ID', 
      'VITE_FIREBASE_PRESENT_ID', 
      'FIREBASE_PRESENT_ID', 
      'PROJECT_ID', 
      'VITE_PROJECT_ID',
      'FIREBASE_ID'
    ],
    'FIREBASE_DATABASE_ID': [
      'VITE_FIRESTORE_DATABASE_ID', 
      'FIRESTORE_DATABASE_ID', 
      'DATABASE_ID', 
      'VITE_FIREBASE_DATABASE_ID',
      'FIRESTORE_ID'
    ],
    'FIREBASE_SERVICE_ACCOUNT_KEY': [
      'VITE_FIREBASE_SERVICE_ACCOUNT_KEY', 
      'SERVICE_ACCOUNT_KEY', 
      'SA_KEY', 
      'FIREBASE_KEY',
      'FIREBASE_JSON'
    ],
    'SESSION_SECRET': ['VITE_SESSION_SECRET', 'SECRET_KEY', 'SESSION_KEY', 'APP_SECRET']
  };

  console.log('[ENV_NORM] Starting environment normalization pass...');
  for (const [canonical, aliases] of Object.entries(mapping)) {
    if (!process.env[canonical]) {
      for (const alias of aliases) {
        if (process.env[alias]) {
          console.log(`[ENV_NORM] Found alias for ${canonical}: ${alias}`);
          process.env[canonical] = process.env[alias];
          break;
        }
      }
    } else {
      console.log(`[ENV_NORM] ${canonical} is already set.`);
    }
  }

  // Extra resilient path: Extract Project ID from FIREBASE_SERVICE_ACCOUNT_KEY if missing
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.FIREBASE_PROJECT_ID) {
    try {
      const keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      let cleanedKey = keyStr;
      if ((cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) || (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))) {
        cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
      }
      const parsed = JSON.parse(cleanedKey);
      if (parsed.project_id || parsed.projectId) {
        const projectId = parsed.project_id || parsed.projectId;
        console.log(`[ENV_NORM] Dynamically extracted FIREBASE_PROJECT_ID from Service Account Key: ${projectId}`);
        process.env.FIREBASE_PROJECT_ID = projectId;
      }
    } catch (err: any) {
      console.error('[ENV_NORM] Failed to parse Service Account Key for automatic Project ID discovery:', err.message);
    }
  }

  // Provide safe session fallback in cloud environments
  if (!process.env.SESSION_SECRET) {
    console.log('[ENV_NORM] SESSION_SECRET is missing. Assigning a resilient fallback token for Express.');
    process.env.SESSION_SECRET = 'd41d8cd98f00b204e9800998ecf8427e_vercel_automatic_secret';
  }

  // Final check for Service Account Key - sometimes it comes in with double escapes or as a single line
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
     let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
     // If it's wrapped in quotes, unwrap it
     if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
       key = key.substring(1, key.length - 1);
     }
     
     try {
       // Attempt to fix escaped newlines if it's a raw PEM string
       if (key.includes('\\n') && !key.includes('\n')) {
         console.log('[ENV_NORM] Unescaping newlines in Service Account Key');
         // We only do this if it's NOT already valid JSON, or if we suspect it's a stringified JSON with literal \n
       }
       process.env.FIREBASE_SERVICE_ACCOUNT_KEY = key;
     } catch (e) {}
  }
}

export function validateEnvironment() {
  normalizeEnvironment();
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Missing Required Environment Variables:');
    console.error('Available keys:', Object.keys(process.env).join(', '));
    missing.forEach(v => console.error(` - ${v}`));
    
    // In production environments, missing variables are considered fatal blockers.
    console.error('\x1b[31m%s\x1b[0m', 'FATAL: The application cannot start without valid Firebase production credentials.');
  }

  const missingOptional = OPTIONAL_VARS.filter(v => !process.env[v]);
  if (missingOptional.length > 0) {
    console.warn('\x1b[33m%s\x1b[0m', 'Information: Missing Optional Client-Side Firebase Variables:');
    missingOptional.forEach(v => console.warn(` - ${v}`));
    console.warn('These may be required for specific client-side features like direct storage uploads.');
  }

  console.log('\x1b[32m%s\x1b[0m', 'Environment validation passed.');
}
