
console.log('Environment Variables Check:');
const interesting = [
  'FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID',
  'FIREBASE_DATABASE_ID', 'FIRESTORE_DATABASE_ID', 'VITE_FIRESTORE_DATABASE_ID',
  'FIREBASE_SERVICE_ACCOUNT_KEY', 'PROJECT_ID', 'GOOGLE_CLOUD_PROJECT'
];

interesting.forEach(key => {
  const val = process.env[key];
  if (val) {
    if (key.includes('KEY') || key.includes('SECRET')) {
      console.log(`${key}: [PRESENT, size=${val.length}]`);
    } else {
      console.log(`${key}: ${val}`);
    }
  } else {
    console.log(`${key}: [NOT SET]`);
  }
});
