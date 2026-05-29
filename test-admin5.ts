const admin = require("firebase-admin");

console.log("Original typeof:", typeof admin.firestore);
try {
  const orig = admin.firestore;
  admin.firestore = function() { return "patched " + orig(); };
  console.log("Execution:", admin.firestore());
} catch(e: any) {
  console.log("Error:", e.message);
}
