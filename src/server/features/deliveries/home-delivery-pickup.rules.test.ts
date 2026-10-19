import { describe, expect, test } from 'bun:test';
import { DeliveryMode, ParcelStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { assertHomeDeliveryReadyForPickup } from './home-delivery-pickup.rules';

const ready = {
  companyId: 'company',
  branchId: 'branch',
  permissions: [PermissionKeys.CanCompleteDoorstepDelivery],
  parcel: {
    companyId: 'company',
    destinationId: 'branch',
    isDeleted: false,
    status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
  },
  delivery: {
    mode: DeliveryMode.DOORSTEP,
    status: 'RIDER_GIVEN_PARCEL_TO_CUSTOMER',
    isDeleted: false,
    returnedAt: null as Date | null,
    deliveredAt: null as Date | null,
  },
};

describe('home delivery return to pickup eligibility', () => {
  test('cashier can correct an unfinalized rider handover', () => {
    expect(() => assertHomeDeliveryReadyForPickup(ready)).not.toThrow();
  });
  test('address collection can return a request before a delivery record exists', () => {
    expect(() =>
      assertHomeDeliveryReadyForPickup({
        ...ready,
        parcel: { ...ready.parcel, status: ParcelStatus.HOME_DELIVERY_REQUESTED },
        delivery: null,
        permissions: [PermissionKeys.CanMarkDoorstepCalled],
      }),
    ).not.toThrow();
  });
  test('dispatch and rider returns retain their existing actions', () => {
    for (const status of [ParcelStatus.ADDRESS_COLLECTED, ParcelStatus.RETURNED_TO_OFFICE]) {
      expect(() =>
        assertHomeDeliveryReadyForPickup({
          ...ready,
          parcel: { ...ready.parcel, status },
          permissions: [PermissionKeys.CanDispatchForDelivery],
          delivery: {
            ...ready.delivery,
            status:
              status === ParcelStatus.ADDRESS_COLLECTED
                ? 'ADDRESS_COLLECTED'
                : 'RETURNED_TO_OFFICE',
            returnedAt: new Date(),
          },
        }),
      ).not.toThrow();
    }
  });
  test('dispatch and address staff cannot correct cashier handovers without cashier permission', () => {
    for (const permission of [
      PermissionKeys.CanDispatchForDelivery,
      PermissionKeys.CanMarkDoorstepCalled,
    ]) {
      expect(() =>
        assertHomeDeliveryReadyForPickup({ ...ready, permissions: [permission] }),
      ).toThrow('Missing permission');
    }
  });
  test('missing, deleted and foreign parcels are hidden', () => {
    for (const parcel of [
      null,
      { ...ready.parcel, isDeleted: true },
      { ...ready.parcel, companyId: 'other' },
      { ...ready.parcel, destinationId: 'other' },
    ]) {
      expect(() => assertHomeDeliveryReadyForPickup({ ...ready, parcel })).toThrow(
        'Parcel not found',
      );
    }
  });
  test('completed, dispatched, pickup and source-return states are rejected', () => {
    for (const status of [
      ParcelStatus.DELIVERED_AT_HOME,
      ParcelStatus.DELIVERED_BY_OFFICE,
      ParcelStatus.DISPATCHED,
      ParcelStatus.AWAITING_PICKUP,
      ParcelStatus.RETURN_TO_SOURCE,
    ]) {
      expect(() =>
        assertHomeDeliveryReadyForPickup({ ...ready, parcel: { ...ready.parcel, status } }),
      ).toThrow('not eligible');
    }
  });
  test('missing, deleted, completed and office deliveries are rejected', () => {
    for (const delivery of [
      null,
      { ...ready.delivery, isDeleted: true },
      { ...ready.delivery, mode: DeliveryMode.OFFICE },
      { ...ready.delivery, deliveredAt: new Date() },
      { ...ready.delivery, status: 'DELIVERED_AT_HOME' },
    ]) {
      expect(() => assertHomeDeliveryReadyForPickup({ ...ready, delivery })).toThrow();
    }
  });
  test('inconsistent rider handovers and incomplete returns are rejected', () => {
    expect(() =>
      assertHomeDeliveryReadyForPickup({
        ...ready,
        delivery: { ...ready.delivery, status: 'DISPATCHED' },
      }),
    ).toThrow('not awaiting');
    expect(() =>
      assertHomeDeliveryReadyForPickup({
        ...ready,
        parcel: { ...ready.parcel, status: ParcelStatus.RETURNED_TO_OFFICE },
        permissions: [PermissionKeys.CanDispatchForDelivery],
        delivery: { ...ready.delivery, status: 'RETURNED_TO_OFFICE' },
      }),
    ).toThrow('no completed rider return');
  });
  test('legacy rider-return endpoint remains restricted to rider returns', () => {
    expect(() =>
      assertHomeDeliveryReadyForPickup({
        ...ready,
        expectedStatus: ParcelStatus.RETURNED_TO_OFFICE,
      }),
    ).toThrow('Only rider-returned parcels');
  });
});
