// Small helper to invoke the Elysia app without opening a port.
// Usage: const res = await http('GET', '/health')

import { app } from '../../src/server/app';
export async function http(method: string, path: string, init?: RequestInit) {
  const url = new URL(path, 'http://localhost');
  const req = new Request(url.toString(), { method, ...init });
  const res = await app.handle(req);
  return res;
}

export async function json<T = unknown>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
