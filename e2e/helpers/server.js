const http = require('http');
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const STUBS_DIR = path.join(__dirname, '..', 'stubs');

const MEDIA_TYPES = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webm': 'video/webm',
  '.mp4':  'video/mp4',
};

// .jpeg canonicalises to stub.jpg; all others → stub{ext}
function stubFilename(ext) {
  return ext === '.jpeg' ? 'stub.jpg' : `stub${ext}`;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const safePath = path.normalize(decodeURIComponent(req.url)).replace(/^(\.\.[/\\])+/, '');
      const ext = path.extname(safePath).toLowerCase();
      const mimeType = MEDIA_TYPES[ext];

      if (mimeType) {
        const stubPath = path.join(STUBS_DIR, stubFilename(ext));
        fs.readFile(stubPath, (err, data) => {
          if (err) {
            res.writeHead(500);
            res.end(`Stub not found: ${stubFilename(ext)}`);
            return;
          }
          res.writeHead(200, { 'Content-Type': mimeType });
          res.end(data);
        });
        return;
      }

      const filePath = path.join(FIXTURES_DIR, safePath);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const port = server.address().port;
        const rewritten = data.replace(/\/\/i\.4cdn\.org/g, `http://localhost:${port}`);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(rewritten);
      });
    });

    // Port 0 lets the OS pick a free port — avoids conflicts when running parallel workers
    server.listen(0, '127.0.0.1', () => {
      server.port = server.address().port;
      resolve(server);
    });
    server.on('error', reject);
  });
}

module.exports = { startServer };
