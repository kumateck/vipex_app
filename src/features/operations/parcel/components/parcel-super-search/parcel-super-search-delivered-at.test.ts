import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { resolveParcelDeliveredAt } from './utils';

const confirmedAt = '2026-10-06T10:00:00.000Z';
const deliveredAt = '2026-10-06T11:00:00.000Z';

describe('Super Search delivered date/time', () => {
  test('uses parcel confirmation for office delivery without a delivery record', () => {
    expect(
      resolveParcelDeliveredAt({ status: ParcelStatus.DELIVERED_BY_OFFICE, confirmedAt }),
    ).toBe(confirmedAt);
  });

  test('uses rider handover confirmation before cashier finalization', () => {
    expect(
      resolveParcelDeliveredAt({
        status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
        confirmedAt,
      }),
    ).toBe(confirmedAt);
  });

  test('prefers completed delivery timestamp over parcel confirmation', () => {
    expect(
      resolveParcelDeliveredAt({
        status: ParcelStatus.DELIVERED_AT_HOME,
        confirmedAt,
        deliveredAt,
      }),
    ).toBe(deliveredAt);
  });

  test('does not show stale delivery timestamps for parcels no longer delivered', () => {
    expect(
      resolveParcelDeliveredAt({
        status: ParcelStatus.RETURNED_TO_OFFICE,
        confirmedAt,
        deliveredAt,
      }),
    ).toBeNull();
    expect(resolveParcelDeliveredAt({ status: ParcelStatus.DISPATCHED, confirmedAt })).toBeNull();
  });

  test('shows no date if neither event has a timestamp', () => {
    expect(resolveParcelDeliveredAt({ status: ParcelStatus.DELIVERED_BY_OFFICE })).toBeNull();
  });
});
