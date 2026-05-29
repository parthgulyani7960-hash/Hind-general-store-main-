import http from 'http';

http.get('http://localhost:3000/api/auth/me', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response status:', res.statusCode, data));
}).on('error', console.error);
