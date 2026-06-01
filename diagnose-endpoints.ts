import http from 'http';

const ENDPOINTS = [
  '/api/announcements',
  '/api/settings',
  '/api/categories',
  '/api/products',
  '/api/auth/me',
  '/api/bugs/report'
];

async function diagnose() {
  console.log('--- Starting Diagnostic Requests ---');
  for (const endpoint of ENDPOINTS) {
    const isPost = endpoint === '/api/bugs/report';
    console.log(`\nTesting: ${isPost ? 'POST' : 'GET'} ${endpoint}`);
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: endpoint,
        method: isPost ? 'POST' : 'GET',
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
        if (options.method === 'POST') {
          req.write(JSON.stringify({
            message: "Unit Test Diagnostic Bug",
            steps_to_reproduce: "Start backend and verify",
            severity: "low"
          }));
        }
        req.end();
      });
    } catch (e: any) {
      console.error(`Error requesting ${endpoint}: ${e.message}`);
    }
  }
}

diagnose();
