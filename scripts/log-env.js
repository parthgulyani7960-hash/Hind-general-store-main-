
console.log('[DIAGNOSTIC] Current environment variables:');
console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
// We only log if it exists, never log the actual secret!
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.log('[DIAGNOSTIC] FIREBASE_SERVICE_ACCOUNT_KEY length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length);
  try {
    const keyData = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('[DIAGNOSTIC] FIREBASE_SERVICE_ACCOUNT_KEY keys:', Object.keys(keyData));
  } catch (e) {
    console.log('[DIAGNOSTIC] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  }
}
