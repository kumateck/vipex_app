import { describe, expect, test } from 'bun:test';
import { buildEligibleParcelCorrectionSessionsQuery } from './parcel-reconciliation-cases.repository';

// Drizzle's postgres-js driver turns off postgres' own Date serializer, so any
// raw Date bound into the query crashes with "Received an instance of Date".
describe('eligible parcel correction sessions query', () => {
  const occurredAt = new Date('2026-10-29T09:49:11.073Z');

  test.each([
    ['with a preferred session', 'session-1'],
    ['without a preferred session', null],
  ])('binds the parcel time as a string, never a Date (%s)', (_label, preferredSessionId) => {
    const { params } = buildEligibleParcelCorrectionSessionsQuery({
      cashierId: 'cashier-1',
      branchId: 'branch-1',
      occurredAt,
      preferredSessionId,
    }).toSQL();

    expect(params.some((param) => param instanceof Date)).toBe(false);
    expect(params.filter((param) => param === occurredAt.toISOString())).toHaveLength(2);
  });
});
