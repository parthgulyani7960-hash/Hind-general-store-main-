const admin = require('firebase-admin');
console.log('Before patch:', admin.firestore.FieldValue);

const originalFirestore = admin.firestore;
const fn = function() { return {}; }
Object.assign(fn, originalFirestore);

console.log('After patch:', fn.FieldValue);
