const http = require('http');

const endpoints = [
  { method: 'GET', path: '/api/settings' },
  { method: 'GET', path: '/api/categories' },
  { method: 'GET', path: '/api/promotions' },
  { method: 'GET', path: '/api/announcements' },
  { method: 'GET', path: '/api/products' },
  { method: 'GET', path: '/api/auth/me' },
  { method: 'POST', path: '/api/bugs/report', body: JSON.stringify({ title: 'Test Bug', description: 'Sample issue' }) }
];

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const postData = endpoint.body || '';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };

    if (endpoint.method === 'POST') {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          path: endpoint.path,
          method: endpoint.method,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          bodyPreview: data.substring(0, 250)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path: endpoint.path,
        method: endpoint.method,
        status: 'ERROR',
        contentType: 'none',
        bodyPreview: err.message
      });
    });

    if (endpoint.method === 'POST') {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log('=== RUNNING DETAILED ENDPOINT PROBES ===');
  for (const ep of endpoints) {
    const res = await makeRequest(ep);
    console.log(`\nROUTE: ${res.method} ${res.path}`);
    console.log(`STATUS: ${res.status}`);
    console.log(`CONTENT-TYPE: ${res.contentType}`);
    console.log(`BODY PREVIEW (first 200 chars):`);
    console.log(res.bodyPreview);
    console.log('--------------------------------------------------');
  }
}

run();
