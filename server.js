const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.svg':'image/svg+xml','.png':'image/png',
  '.jpg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2'
};

http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  // Serve from tetroid-pro if the file exists there, else root
  let file = path.join(__dirname, 'tetroid-pro', url);
  if (!fs.existsSync(file)) file = path.join(__dirname, url);
  const ext = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': (MIME[ext] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(data);
  });
}).listen(3000, () => console.log('Server running on http://localhost:3000'));
