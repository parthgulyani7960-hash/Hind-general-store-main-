import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const integritiesEndpoint = `

  app.get('/api/admin/check-integrities', requireAdmin, async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.status(503).json({ success: false, message: 'Database not ready' });
      
      const db = getFirestoreInstance();
      const usersSnap = await db.collection('users').get();
      const userIds = new Set(usersSnap.docs.map(d => d.id));
      
      const cartsSnap = await db.collection('carts').get();
      const orphanedCarts = [];
      cartsSnap.docs.forEach(doc => {
         const data = doc.data();
         if (!data.user_id || !userIds.has(String(data.user_id))) {
            orphanedCarts.push(doc.id);
         }
      });
      
      const ordersSnap = await db.collection('orders').get();
      const orphanedOrders = [];
      ordersSnap.docs.forEach(doc => {
         const data = doc.data();
         if (!data.user_id || !userIds.has(String(data.user_id))) {
            orphanedOrders.push(doc.id);
         }
      });
      
      res.json({
         success: true,
         checkedAt: new Date().toISOString(),
         usersCount: userIds.size,
         orphanedCarts: orphanedCarts,
         orphanedOrders: orphanedOrders,
         issuesFound: orphanedCarts.length + orphanedOrders.length
      });
    } catch (err: any) {
      console.error('[ADMIN] Error checking integrities:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Global Error Handler - MUST be after all routes`;

content = content.replace("  // Global Error Handler - MUST be after all routes", integritiesEndpoint);

fs.writeFileSync('server.ts', content);
console.log('Added check integrities endpoint');
