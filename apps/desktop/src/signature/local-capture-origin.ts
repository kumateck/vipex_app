import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { sigWebCapturePage } from './sigweb-capture-page';

export function openLocalCaptureOrigin() {
  const path = '/capture/' + randomUUID();
  const server = createServer((request, response) => {
    if (request.method !== 'GET' || request.url !== path) {
      response.writeHead(404).end();
      return;
    }
    response
      .writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .end(sigWebCapturePage);
  });
  return new Promise<{ url: string; close: () => void }>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not open the local signature capture window'));
        return;
      }
      resolve({
        url: `http://127.0.0.1:${address.port}${path}`,
        close: () => {
          server.close();
        },
      });
    });
  });
}
