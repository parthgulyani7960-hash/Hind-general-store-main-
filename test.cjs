const admin = require("firebase-admin");
console.log("Original typeof:", typeof admin.firestore);
try {
  admin.firestore = function() { return "patched"; };
  console.log("Patched!!");
} catch(e) {
  console.log("Error:", e.message);
}
