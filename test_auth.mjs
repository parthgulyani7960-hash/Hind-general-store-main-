import http from 'http';
http.get('http://localhost:3000/api/auth/me', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response /api/auth/me:', data));
}).on('error', err => console.error(err));
