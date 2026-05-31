import http from 'http';

const ENDPOINTS = [
  '/api/announcements',
  '/api/settings',
  '/api/auth/me',
  '/api/auth/firebase-login'
];

async function diagnose() {
  console.log('--- Starting Diagnostic Requests ---');
  for (const endpoint of ENDPOINTS) {
    console.log(`\nTesting: ${endpoint === '/api/auth/firebase-login' ? 'POST' : 'GET'} ${endpoint}`);
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: endpoint,
        method: endpoint === '/api/auth/firebase-login' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      await new Promise<void>((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Content-Type: ${res.headers['content-type']}`);
            console.log(`Response Preview: ${data.substring(0, 200)}`);
            resolve();
          });
        });
        req.on('error', (e) => {
          console.error(`Error requesting ${endpoint}: ${e.message}`);
          resolve();
        });
        if (options.method === 'POST') req.write(JSON.stringify({}));
        req.end();
      });
    } catch (e: any) {
      console.error(`Error requesting ${endpoint}: ${e.message}`);
    }
  }
}

diagnose();
