const admin = require("firebase-admin");

let isDenied = true;
const getSafeMockObject = () => new Proxy({}, {
  get(target, prop) {
    if (prop === 'then') return undefined;
    if (prop === 'collection') return () => getSafeMockObject();
    if (prop === 'get') return () => Promise.resolve(getSafeMockObject());
    if (prop === 'docs') return [];
    return getSafeMockObject();
  }
});

const wrapFirestore = (target) => {
  return new Proxy(target, {
    get(obj, prop) {
      if (isDenied) return getSafeMockObject();
      let val = obj[prop];
      if (typeof val === 'function') {
         return (...args) => {
            const result = val.apply(obj, args);
            if (result && typeof result.then === 'function') return result.then((r) => wrapFirestore(r)).catch((e) => { throw e; });
            return wrapFirestore(result);
         };
      }
      if (val && typeof val === 'object') return wrapFirestore(val);
      return val;
    }
  });
};

admin.firestore = function() {
   return wrapFirestore({});
}

async function test() {
  try {
     const snap = await admin.firestore().collection('notifications').get();
     console.log("Success! Docs:", snap.docs);
  } catch (e) {
     console.error("Failed strictly:", e.message);
  }
}
test();
