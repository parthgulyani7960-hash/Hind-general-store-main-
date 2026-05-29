import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const healthIndicatorEndpoint = `

  app.get('/api/admin/health-indicator', requireAdmin, async (req, res) => {
    try {
      if (!isFirebaseReady || !admin.apps.length) return res.json({ status: 'offline', errorCount: 0 });
      
      const db = getFirestoreInstance();
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const sysLogsSnap = await db.collection('system_logs').where('level', '==', 'error').where('created_at', '>', tenMinsAgo).get();
      
      const errorCount = sysLogsSnap.size;
      let status = 'healthy';
      if (errorCount > 10) status = 'critical';
      else if (errorCount > 0) status = 'warning';
      
      res.json({ status, errorCount });
    } catch (err: any) {
      res.json({ status: 'offline', errorCount: 0 });
    }
  });

  // Global Error Handler - MUST be after all routes`;

content = content.replace("  // Global Error Handler - MUST be after all routes", healthIndicatorEndpoint);
fs.writeFileSync('server.ts', content);
console.log('Added health indicator endpoint');
