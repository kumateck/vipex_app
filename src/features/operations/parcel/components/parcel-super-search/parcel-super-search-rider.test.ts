import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { resolveParcelRider } from './utils';

describe('Super Search home-delivery rider', () => {
  test('labels the rider who delivered a home delivery', () => {
    expect(
      resolveParcelRider({ status: ParcelStatus.DELIVERED_AT_HOME, riderName: 'Kofi Mensah' }),
    ).toEqual({ label: 'D By', name: 'Kofi Mensah' });
    expect(
      resolveParcelRider({
        status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
        riderName: 'Kofi Mensah',
      }),
    ).toEqual({ label: 'D By', name: 'Kofi Mensah' });
  });

  test('labels assigned and returning riders', () => {
    expect(resolveParcelRider({ status: ParcelStatus.DISPATCHED, riderName: 'Ama' })?.label).toBe(
      'Assigned Rider',
    );
    expect(
      resolveParcelRider({ status: ParcelStatus.RETURNED_TO_OFFICE, riderName: 'Ama' })?.label,
    ).toBe('Returned By');
  });

  test('shows Not assigned when a home-delivery parcel has no rider', () => {
    expect(
      resolveParcelRider({ status: ParcelStatus.HOME_DELIVERY_REQUESTED, riderName: null }),
    ).toEqual({ label: 'Assigned Rider', name: 'Not assigned' });
    expect(resolveParcelRider({ status: ParcelStatus.DISPATCHED, riderName: '  ' })?.name).toBe(
      'Not assigned',
    );
  });

  test('shows no rider for statuses unrelated to home delivery', () => {
    expect(
      resolveParcelRider({ status: ParcelStatus.DELIVERED_BY_OFFICE, riderName: 'Kofi' }),
    ).toBeNull();
    expect(resolveParcelRider({ status: ParcelStatus.IN_TRANSIT, riderName: 'Kofi' })).toBeNull();
  });
});
