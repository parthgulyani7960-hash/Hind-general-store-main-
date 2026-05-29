import admin from "firebase-admin";

console.log("Original typeof:", typeof admin.firestore);
// @ts-ignore
admin.firestore = function() { return "patched"; };
console.log("Patched typeof:", typeof admin.firestore);
