import { describe, expect, test, spyOn } from 'bun:test';
import { buildServerErrorLogRecord, logServerError } from '@/server/middlewares';
import { logger } from '@/server/utils/logger';

const context = {
  status: 500,
  requestId: 'req-reconciliation',
  path: '/v1/shipments/parcels?search=private-code',
  method: 'GET',
  frameworkCode: 'UNKNOWN',
  publicCode: 'INTERNAL_SERVER_ERROR',
  publicMessage: 'Something went wrong. Please try again.',
};
describe('production API failure logging', () => {
  test('unwraps the database cause without logging query text, contacts or key values', () => {
    const record = buildServerErrorLogRecord({
      ...context,
      originalMessage: 'Failed query with private-customer',
      stack: 'private-stack',
      details: { telephone: '0551112222' },
      cause: {
        message: 'wrapper private-query',
        params: ['private-bind'],
        cause: {
          code: '53100',
          routine: 'dsm_impl_posix',
          message: 'private-error',
          detail: 'private-key-value',
        },
      },
    });
    expect(record).toMatchObject({
      requestId: 'req-reconciliation',
      path: '/v1/shipments/parcels',
      status: 500,
      originalCode: '53100',
      database: { routine: 'dsm_impl_posix' },
    });
    expect(JSON.stringify(record)).not.toContain('private');
    expect(JSON.stringify(record)).not.toContain('0551112222');
  });
  test('includes safe missing-table metadata and handles unclassified and circular causes', () => {
    expect(
      buildServerErrorLogRecord({
        ...context,
        cause: { code: '42P01', table: 'self_service_sessions' },
      }),
    ).toMatchObject({
      originalCode: '42P01',
      database: { table: 'self_service_sessions' },
    });
    expect(buildServerErrorLogRecord(context)?.originalCode).toBeNull();
    const cyclic: { code: string; cause?: unknown } = { code: 'ECONNREFUSED' };
    cyclic.cause = cyclic;
    expect(buildServerErrorLogRecord({ ...context, cause: cyclic })?.originalCode).toBe(
      'ECONNREFUSED',
    );
    expect(buildServerErrorLogRecord({ ...context, status: 403 })).toBeUndefined();
  });
  test('writes a structured production failure independently of alert delivery', () => {
    const write = spyOn(logger, 'error').mockImplementation(() => {});
    try {
      logServerError(
        {
          ...context,
          originalMessage: 'private-query',
          cause: { code: '53100', routine: 'dsm_impl_posix', message: 'private-customer' },
        },
        true,
      );
      expect(write).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledWith(
        'api-server-error',
        expect.objectContaining({
          requestId: 'req-reconciliation',
          path: '/v1/shipments/parcels',
          status: 500,
          originalCode: '53100',
          database: { routine: 'dsm_impl_posix' },
        }),
      );
      expect(JSON.stringify(write.mock.calls)).not.toContain('private');
      logServerError({ ...context, status: 400 }, true);
      expect(write).toHaveBeenCalledTimes(1);
    } finally {
      write.mockRestore();
    }
  });
});
