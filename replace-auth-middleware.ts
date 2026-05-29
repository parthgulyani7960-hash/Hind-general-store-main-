import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/async function requireAuth\(req: express\.Request, res: express\.Response, next: express\.NextFunction\) \{[\s\S]*?    \} catch \(err: any\) \{/m, `async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      if (req.session?.userId) {
         if (req.session.role) return next();
         if (!isFirebaseReady) return res.status(503).json({ success: false, message: 'Database connection is currently offline or unavailable.' });
         const doc = await getFirestoreInstance().collection('users').doc(String(req.session.userId)).get();
         if (doc.exists) {
            req.session.role = doc.data()?.role || 'customer';
            return next();
         }
         req.session = null;
      }
      
      const user = await verifyFirebaseUser(req);
      if (user) return next();

      return res.status(401).json({ success: false, message: 'Authentication required' });
    } catch (err: any) {`);

fs.writeFileSync('server.ts', content);
console.log('Fixed auth middleware');
