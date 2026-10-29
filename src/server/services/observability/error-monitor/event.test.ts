import { describe, expect, test } from 'bun:test';
import {
  buildErrorEvent,
  computeFingerprint,
  normalizePath,
  sanitizeMessage,
  topFrame,
} from './event';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function errorWithStack(name: string, frames: string[]): Error {
  const error = new Error('boom');
  error.name = name;
  error.stack = [`${name}: boom`, ...frames.map((f) => `    at ${f}`)].join('\n');
  return error;
}

describe('error monitor fingerprint', () => {
  test('ignores ids, line numbers and record-specific messages', () => {
    const a = errorWithStack('TypeError', [
      'createParcel (/app/src/server/features/parcels/service.ts:120:15)',
    ]);
    const b = errorWithStack('TypeError', [
      'createParcel (/srv/build/src/server/features/parcels/service.ts:131:9)',
    ]);
    b.message = 'parcel cm9x2k4p70000abcd1234efgh not found';

    const first = buildErrorEvent(a, { path: '/v1/shipments/parcels/cm9x2k4p70000abcd1234efgh' });
    const second = buildErrorEvent(b, { path: '/v1/shipments/parcels/42' });
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  test('separates different exception types, routes and frames', () => {
    const base = computeFingerprint('TypeError', '/v1/parcels/:id', 'at a (src/x.ts)');
    expect(computeFingerprint('RangeError', '/v1/parcels/:id', 'at a (src/x.ts)')).not.toBe(base);
    expect(computeFingerprint('TypeError', '/v1/payments/:id', 'at a (src/x.ts)')).not.toBe(base);
    expect(computeFingerprint('TypeError', '/v1/parcels/:id', 'at b (src/x.ts)')).not.toBe(base);
  });

  test('uses the root cause type and prefers frames outside node_modules', () => {
    const root = errorWithStack('PostgresError', [
      'parse (/app/node_modules/postgres/src/connection.js:790:26)',
      'listParcels (/app/src/server/features/parcels/repo.ts:44:11)',
    ]);
    const wrapper = new Error('Failed query: select 1\nparams: 0244000000,secret@example.com', {
      cause: root,
    });
    wrapper.name = 'DrizzleQueryError';

    const event = buildErrorEvent(wrapper, { route: '/v1/parcels' });
    expect(event.exceptionType).toBe('PostgresError');
    expect(topFrame(root)).toBe('at listParcels src/server/features/parcels/repo.ts');
    expect(event.message).toBe('Failed query: select 1');
    expect(event.exceptionDetails).not.toContain('secret@example.com');
    expect(event.exceptionDetails).toContain('Caused by: PostgresError');
  });

  test('normalizes id-like path segments but keeps words', () => {
    expect(normalizePath('/v1/parcels/123/items/cm9x2k4p70000abcd1234efgh?x=1')).toBe(
      '/v1/parcels/:id/items/:id',
    );
    expect(normalizePath('/v1/users/0b8f6a1e-3c1d-4c7e-9a8b-2f1d3e4c5b6a')).toBe('/v1/users/:id');
  });

  test('drops SQL params from messages', () => {
    expect(sanitizeMessage('Failed query: x\nparams: a,b')).toBe('Failed query: x');
  });
});

describe('error monitor event', () => {
  test('has a fresh GUID id and request details', () => {
    const event = buildErrorEvent(new Error('x'), {
      statusCode: 500,
      method: 'POST',
      path: '/v1/payments?ref=1',
      route: '/v1/payments',
      traceId: 'req-1',
      userId: 'cm9x2k4p70000abcd1234efgh',
      userEmail: 'cashier@vipex.test',
    });
    expect(event.id).toMatch(UUID);
    expect(event.id).not.toBe(buildErrorEvent(new Error('x')).id);
    expect(event).toMatchObject({
      statusCode: 500,
      httpMethod: 'POST',
      path: '/v1/payments',
      routeTemplate: '/v1/payments',
      traceId: 'req-1',
      userEmail: 'cashier@vipex.test',
    });
    // The monitor only accepts UUID user ids; a cuid would make it reject the whole batch.
    expect(event.userId).toBeNull();
    const uuidUser = '0b8f6a1e-3c1d-4c7e-9a8b-2f1d3e4c5b6a';
    expect(buildErrorEvent(new Error('x'), { userId: uuidUser }).userId).toBe(uuidUser);
  });

  test('handles thrown non-errors', () => {
    const event = buildErrorEvent('plain string');
    expect(event.message).toBe('plain string');
    expect(event.exceptionType).toBe('string');
    expect(event.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});
