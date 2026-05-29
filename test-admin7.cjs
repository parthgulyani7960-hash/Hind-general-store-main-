const admin = require("firebase-admin");

admin.firestore = function() {
   console.log("MY FUNCTION CALLED!");
   return {};
}

try {
   admin.firestore();
} catch (e) {
   console.error("Error:", e.message);
}
