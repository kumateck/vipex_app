import { describe, expect, test } from 'bun:test';
import { Elysia, t } from 'elysia';
import { errorHandler } from '../../src/server/middlewares/error-handler';
import {
  assertNoOutstandingStorageForHandover,
  assertValidStorageCollectionAmount,
  resolveAndValidateStorageWaiverAmountPsw,
  validateStorageWaiverReason,
} from '../../src/server/features/shipments/storage-accrual-guards';
import { HttpStatus } from '../../src/server/utils/http-status';

type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    status: number;
  };
};

const app = new Elysia()
  .use(errorHandler)
  .post(
    '/storage-waivers/validate',
    ({ body }) => {
      const payload = body as {
        reason: string;
        outstandingPsw: number;
        requestedPsw?: number | null;
      };
      const reason = validateStorageWaiverReason(payload.reason);
      const waivedPsw = resolveAndValidateStorageWaiverAmountPsw({
        outstandingPsw: payload.outstandingPsw,
        requestedPsw: payload.requestedPsw ?? null,
      });
      return { ok: true, reason, waivedPsw };
    },
    {
      body: t.Object({
        reason: t.String(),
        outstandingPsw: t.Number(),
        requestedPsw: t.Optional(t.Union([t.Number(), t.Null()])),
      }),
    },
  )
  .post(
    '/storage-handover/validate',
    ({ body }) => {
      const payload = body as { outstandingPsw: number; collectionPsw: number };
      assertValidStorageCollectionAmount({
        outstandingPsw: payload.outstandingPsw,
        collectionPsw: payload.collectionPsw,
      });
      assertNoOutstandingStorageForHandover(payload.outstandingPsw - payload.collectionPsw);
      return { ok: true };
    },
    {
      body: t.Object({
        outstandingPsw: t.Number(),
        collectionPsw: t.Number(),
      }),
    },
  );

async function request(path: string, body: unknown) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('storage waiver and handover contracts', () => {
  test('rejects waiver without reason', async () => {
    const res = await request('/storage-waivers/validate', {
      reason: '   ',
      outstandingPsw: 500,
      requestedPsw: 100,
    });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    const json = (await res.json()) as ErrorEnvelope;
    expect(json.error.message).toContain('Waiver reason is required');
  });

  test('rejects over-waiver via contract', async () => {
    const res = await request('/storage-waivers/validate', {
      reason: 'manual override approved',
      outstandingPsw: 500,
      requestedPsw: 700,
    });
    expect(res.status).toBe(HttpStatus.CONFLICT);
    const json = (await res.json()) as ErrorEnvelope;
    expect(json.error.message).toContain('Waived amount cannot exceed outstanding storage accrual');
  });

  test('rejects handover when storage collection is incomplete', async () => {
    const res = await request('/storage-handover/validate', {
      outstandingPsw: 800,
      collectionPsw: 500,
    });
    expect(res.status).toBe(HttpStatus.CONFLICT);
    const json = (await res.json()) as ErrorEnvelope;
    expect(json.error.message).toContain(
      'Storage accrual must be settled or waived before handover',
    );
  });

  test('accepts handover when storage is fully collected', async () => {
    const res = await request('/storage-handover/validate', {
      outstandingPsw: 800,
      collectionPsw: 800,
    });
    expect(res.status).toBe(HttpStatus.OK);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });
});
