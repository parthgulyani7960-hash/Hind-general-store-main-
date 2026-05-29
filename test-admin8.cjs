const admin = require("firebase-admin");

try {
  Object.defineProperty(admin, 'firestore', {
    get: function() { return function() { console.log("PATCHED!"); return {}; } },
    configurable: true
  });
  admin.firestore();
} catch (e) {
  console.error("Error:", e.message);
}
