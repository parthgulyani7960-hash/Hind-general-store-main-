import * as admin from "firebase-admin";

console.log("Original typeof:", typeof admin.firestore);
const orig = admin.firestore;
// @ts-ignore
admin.firestore = function() { return "patched"; };
console.log("Patched typeof:", typeof admin.firestore);
try {
  console.log("Patched execution:", admin.firestore());
} catch(e: any) {
  console.log("Error executing:", e.message);
}
