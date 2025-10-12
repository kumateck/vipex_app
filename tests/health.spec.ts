import { describe, test, expect } from 'bun:test';
import { http, json } from './utils/request';
import { HttpStatus } from '../src/server/utils/http-status';

describe('health route', () => {
  test('GET /health returns ok', async () => {
    const res = await http('GET', '/health');
    expect(res.status).toBe(HttpStatus.OK);
    const body = await json<{ status: string }>(res);
    expect(body.status.toLowerCase()).toContain('ok');
  });

  test('GET /unknown returns JSON 404 inside Elysia', async () => {
    const res = await http('GET', '/__does-not-exist__');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
    const body = await json<{ error: { status: number; message: string } }>(res);
    expect(body.error.status).toBe(HttpStatus.NOT_FOUND);
  });
});
