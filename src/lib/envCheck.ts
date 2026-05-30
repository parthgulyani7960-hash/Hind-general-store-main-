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

export function validateEnvironment() {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Missing Required Environment Variables:');
    missing.forEach(v => console.error(` - ${v}`));
    
    // In production, we want to fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error('Production deployment cannot proceed without these variables. Exiting...');
      process.exit(1);
    } else {
      console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Running in development mode with limited functionality.');
    }
  }

  const missingOptional = OPTIONAL_VARS.filter(v => !process.env[v]);
  if (missingOptional.length > 0) {
    console.warn('\x1b[33m%s\x1b[0m', 'Information: Missing Optional Client-Side Firebase Variables:');
    missingOptional.forEach(v => console.warn(` - ${v}`));
    console.warn('These may be required for specific client-side features like direct storage uploads.');
  }

  console.log('\x1b[32m%s\x1b[0m', 'Environment validation passed.');
}
