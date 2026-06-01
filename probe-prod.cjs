const http = require('http');

const ENDPOINTS = [
  '/api/settings',
  '/api/categories',
  '/api/promotions',
  '/api/announcements',
  '/api/products',
  '/api/auth/me',
  '/api/bugs/report'
];

async function probe() {
  console.log('\n\n--- Probing Local Container Port 3000 (HTTP) ---');
  for (const endpoint of ENDPOINTS) {
    const isPost = endpoint === '/api/bugs/report';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: isPost ? 'POST' : 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Production-Probe',
        'Content-Type': 'application/json'
      }
    };

    await new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log(`Endpoint: ${isPost ? 'POST' : 'GET'} ${endpoint} | Status: ${res.statusCode} | Content-Type: ${res.headers['content-type']} | Preview: ${body.substring(0, 150).replace(/\n/g, ' ')}`);
          resolve();
        });
      });

      req.on('error', (err) => {
        console.error(`Error on ${endpoint}:`, err.message);
        resolve();
      });

      if (isPost) {
        req.write(JSON.stringify({ title: 'Test Bug', description: 'API routing probe test' }));
      }
      req.end();
    });
  }
}

probe();
