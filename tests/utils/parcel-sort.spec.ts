import { describe, expect, test } from 'bun:test';
import { resolveParcelSort } from '../../src/server/features/shipments/parcel-sort';

describe('parcel list ordering', () => {
  test('orders newest-created parcels first with a stable tie-breaker', () => {
    expect(resolveParcelSort(undefined, 'desc')).toEqual([
      { field: 'createdAt', direction: 'desc' },
      { field: 'id', direction: 'desc' },
    ]);
  });

  test('preserves the requested sort when no created-at order is enforced', () => {
    const sort = [{ field: 'bookingCode', direction: 'asc' as const }];
    expect(resolveParcelSort(sort, undefined)).toBe(sort);
  });
});
