import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { extractScannedCode } from '@mobile/lib/scan-code';
import {
  buildPickupListQuery,
  getPickupQueueBadgeNumber,
  getQueueFilterBySearch,
} from './pickup-list-query';

const context = { companyId: 'co', branchId: 'br', locationId: 'loc', locationName: 'Front' };

describe('office pickup list query', () => {
  test('shows only active ticket numbers when the branch uses pickup queues', () => {
    const ticket = { pickupQueueNumber: 47, pickupQueueEndedAt: null };
    expect(getPickupQueueBadgeNumber(true, ticket)).toBe(47);
    expect(getPickupQueueBadgeNumber(false, ticket)).toBeNull();
    expect(getPickupQueueBadgeNumber(true, { ...ticket, pickupQueueEndedAt: 'ended' })).toBeNull();
    expect(getPickupQueueBadgeNumber(true, { pickupQueueNumber: null })).toBeNull();
  });
  test('lists only queued parcels by default when pickup queues are on', () => {
    expect(buildPickupListQuery(context, true, '')).toEqual({
      page: 1,
      pageSize: 20,
      companyId: 'co',
      destinationId: 'br',
      status: ParcelStatus.AWAITING_PICKUP,
      cashierCollectionRequired: false,
      hasPickupQueue: true,
    });
  });

  test('a search looks past the queue filter so unqueued parcels can be found', () => {
    const query = buildPickupListQuery(context, true, '  TRK-1 ');
    expect(query?.search).toBe('TRK-1');
    expect(query && 'hasPickupQueue' in query).toBe(false);
  });

  test('needs a search when pickup queues are off, as on web', () => {
    expect(buildPickupListQuery(context, false, '   ')).toBeNull();
    expect(buildPickupListQuery(context, false, '0241234567')?.search).toBe('0241234567');
  });

  test('never queries outside the staff member’s company and branch', () => {
    expect(buildPickupListQuery({ ...context, branchId: null }, true, 'x')).toBeNull();
    expect(buildPickupListQuery({ ...context, companyId: null }, true, 'x')).toBeNull();
  });

  test('always excludes parcels that still owe money (receiver cashier handles those)', () => {
    expect(buildPickupListQuery(context, false, 'abc')?.cashierCollectionRequired).toBe(false);
  });

  test.each(['https://vipexparcel.com/tracking/TRK-1?source=qr', 'QR-TRK-1', 'TRK-1'])(
    'looks up sticker payload %s by exact code and keeps pickup eligibility filters',
    (sticker) => {
      expect(buildPickupListQuery(context, true, extractScannedCode(sticker), true)).toEqual({
        page: 1,
        pageSize: 20,
        companyId: 'co',
        destinationId: 'br',
        status: ParcelStatus.AWAITING_PICKUP,
        cashierCollectionRequired: false,
        parcelCode: 'TRK-1',
      });
    },
  );

  test('queue filter matches the web helper', () => {
    expect(getQueueFilterBySearch(false, '')).toBeUndefined();
    expect(getQueueFilterBySearch(true, '')).toBe(true);
    expect(getQueueFilterBySearch(true, 'abc')).toBeUndefined();
  });
});
