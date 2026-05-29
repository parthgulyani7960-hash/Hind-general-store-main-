import * as admin from "firebase-admin";

console.log("Original typeof:", typeof admin.firestore);

try {
  const orig = admin.firestore;
  Object.defineProperty(admin, 'firestore', {
    get: function() { return function() { return "patched"; } },
    configurable: true
  });
  console.log("Patched typeof:", typeof admin.firestore);
  console.log("Execution:", admin.firestore());
} catch(e: any) {
  console.log("Error:", e.message);
}
