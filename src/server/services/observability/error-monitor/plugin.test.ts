import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { gunzipSync } from 'node:zlib';
import { requestId } from '@/server/middlewares/requestId';
import { errorHandler } from '@/server/middlewares/error-handler';
import { BadRequest } from '@/server/utils/http-error';
import { ErrorMonitor } from './client';
import type { MonitorEvent } from './event';
import { setErrorMonitorForTesting } from './index';
import { errorMonitorPlugin } from './plugin';

let sent: MonitorEvent[] = [];
const fetchImpl = (async (_input: string | URL | Request, init?: RequestInit) => {
  const body = JSON.parse(gunzipSync(init!.body as Uint8Array).toString('utf8'));
  sent.push(...(body.events ?? []));
  return new Response(null, { status: 200 });
}) as typeof fetch;

const monitor = new ErrorMonitor({
  url: 'https://monitor.test',
  apiKey: 'k',
  flushDelayMs: 60_000,
  fetch: fetchImpl,
  log: () => undefined,
});

const app = new Elysia()
  .use(requestId)
  .use(errorHandler)
  .use(errorMonitorPlugin)
  .get('/v1/parcels/:id', () => {
    throw new TypeError('cannot read property of undefined');
  })
  .get('/v1/unavailable', ({ set }) => {
    set.status = 503;
    return { ok: false };
  })
  .get('/v1/bad', () => {
    throw BadRequest('nope');
  })
  .get('/v1/ok', () => ({ ok: true }));

async function call(path: string) {
  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      headers: { 'x-request-id': 'req-42', 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
    }),
  );
  await response.text();
  // onAfterResponse runs after the response is returned.
  await Bun.sleep(5);
  await monitor.flush();
  return response;
}

beforeEach(() => {
  sent = [];
  setErrorMonitorForTesting(monitor);
});

afterAll(() => {
  monitor.stop();
  setErrorMonitorForTesting(undefined);
});

describe('error monitor request hooks', () => {
  test('reports a thrown error once, with route, trace id and client IP', async () => {
    const response = await call('/v1/parcels/cm9x2k4p70000abcd1234efgh');

    expect(response.status).toBe(500);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      exceptionType: 'TypeError',
      statusCode: 500,
      httpMethod: 'GET',
      path: '/v1/parcels/cm9x2k4p70000abcd1234efgh',
      routeTemplate: '/v1/parcels/:id',
      traceId: 'req-42',
      ipAddress: '1.2.3.4',
    });
  });

  test('reports a 5xx response that was returned without throwing', async () => {
    const response = await call('/v1/unavailable');

    expect(response.status).toBe(503);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      statusCode: 503,
      exceptionType: 'Http503Response',
      path: '/v1/unavailable',
    });
  });

  test('ignores client errors and successful requests', async () => {
    expect((await call('/v1/bad')).status).toBe(400);
    expect((await call('/v1/ok')).status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  test('does nothing when the monitor is not configured', async () => {
    setErrorMonitorForTesting(null);
    expect((await call('/v1/parcels/1')).status).toBe(500);
    expect(sent).toHaveLength(0);
  });
});
