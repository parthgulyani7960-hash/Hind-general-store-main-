import admin from "firebase-admin";

console.log("Original typeof:", typeof admin.firestore);
try {
  // @ts-ignore
  admin.firestore = function() { return "patched"; };
  console.log("Patched typeof:", typeof admin.firestore);
} catch(e: any) {
  console.log("Error patching:", e.message);
}
