import { describe, expect, test } from 'bun:test';
import { Elysia, t } from 'elysia';
import { errorHandler } from '../../src/server/middlewares/error-handler';
import { BadRequest } from '../../src/server/utils/http-error';
import { HttpStatus } from '../../src/server/utils/http-status';

type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    status: number;
    requestId: string;
    path: string;
    method: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
};

const app = new Elysia()
  .use(errorHandler)
  .get('/test/http-error', () => {
    throw BadRequest('Readable message for users', { field: 'email' });
  })
  .get('/test/unexpected', () => {
    throw new Error('sensitive internal detail');
  })
  .get('/test/upstream-timeout', () => {
    const error = new Error('Failed query: select 1');
    (error as Error & { code?: string }).code = 'CONNECT_TIMEOUT';
    throw error;
  })
  .post('/test/validation', ({ body }) => body, {
    body: t.Object({
      amount: t.Number({ minimum: 1 }),
    }),
  });

async function request(method: string, path: string, body?: unknown): Promise<Response> {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-test-001',
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

describe('Error handler contract', () => {
  test('returns normalized payload for HttpError', async () => {
    const res = await request('GET', '/test/http-error');
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);

    const json = (await res.json()) as ErrorEnvelope;
    expect(json.error.code).toBe('HTTP_ERROR');
    expect(json.error.message).toBe('Readable message for users');
    expect(json.error.status).toBe(HttpStatus.BAD_REQUEST);
    expect(json.error.requestId).toBe('req-test-001');
    expect(json.error.path).toBe('/test/http-error');
    expect(json.error.method).toBe('GET');
    expect(json.error.details?.field).toBe('email');
  });

  test('hides internal messages for unexpected errors', async () => {
    const res = await request('GET', '/test/unexpected');
    expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

    const json = (await res.json()) as ErrorEnvelope;
    expect(json.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(json.error.message).toBe('Something went wrong. Please try again.');
    expect(json.error.path).toBe('/test/unexpected');
    expect(json.error.requestId).toBe('req-test-001');
  });

  test('returns readable validation errors', async () => {
    const res = await request('POST', '/test/validation', { amount: 0 });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);

    const json = (await res.json()) as ErrorEnvelope;
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('validation');
    expect(json.error.path).toBe('/test/validation');
    expect(Array.isArray(json.error.details?.fields)).toBe(true);
  });

  test('maps infra connect timeout to service unavailable', async () => {
    const res = await request('GET', '/test/upstream-timeout');
    expect(res.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);

    const json = (await res.json()) as ErrorEnvelope;
    expect(json.error.code).toBe('UPSTREAM_UNAVAILABLE');
    expect(json.error.message).toBe('A dependent service is temporarily unavailable.');
    expect(json.error.path).toBe('/test/upstream-timeout');
    expect(json.error.requestId).toBe('req-test-001');
  });
});
