
async function verify() {
  const endpoints = [
    '/ping',
    '/api/boot-status',
    '/api/settings',
    '/api/categories',
    '/api/promotions',
    '/api/announcements',
    '/api/products',
    '/api/auth/me'
  ];
  
  for (const path of endpoints) {
    const start = Date.now();
    try {
      const res = await fetch(`http://localhost:3000${path}`);
      const duration = Date.now() - start;
      const contentType = res.headers.get('content-type');
      let body: any;
      if (contentType?.includes('application/json')) {
        body = await res.json();
      } else {
        const text = await res.text();
        body = text.length > 200 ? text.substring(0, 200) + '...' : text;
      }
      
      console.log(`Endpoint: ${path}`);
      console.log(`Status: ${res.status}`);
      console.log(`Content-Type: ${contentType}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Body: ${typeof body === 'object' ? JSON.stringify(body, null, 2) : body}`);
      console.log('---');
    } catch (err: any) {
      console.log(`Endpoint: ${path}`);
      console.log(`Error: ${err.message}`);
      console.log('---');
    }
  }
}

verify();
