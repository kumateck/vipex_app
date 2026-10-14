import { DeliveryMode, ParcelStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { Conflict, Forbidden, NotFound } from '@/server/utils/http-error';

const pickupPermissions = new Map<number, string>([
  [ParcelStatus.HOME_DELIVERY_REQUESTED, PermissionKeys.CanMarkDoorstepCalled],
  [ParcelStatus.ADDRESS_COLLECTED, PermissionKeys.CanDispatchForDelivery],
  [ParcelStatus.RETURNED_TO_OFFICE, PermissionKeys.CanDispatchForDelivery],
  [ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER, PermissionKeys.CanCompleteDoorstepDelivery],
]);

type PickupParcel = {
  companyId: string;
  destinationId: string;
  status: number;
  isDeleted: boolean;
};

export function assertHomeDeliveryReadyForPickup<TParcel extends PickupParcel>(input: {
  parcel: TParcel | null;
  delivery: {
    mode: number;
    status: string;
    isDeleted: boolean;
    returnedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  companyId: string;
  branchId: string;
  permissions: readonly string[];
  expectedStatus?: number;
}) {
  const { parcel, delivery } = input;
  if (
    !parcel ||
    parcel.isDeleted ||
    parcel.companyId !== input.companyId ||
    parcel.destinationId !== input.branchId
  ) {
    throw NotFound('Parcel not found at this branch');
  }
  if (input.expectedStatus !== undefined && parcel.status !== input.expectedStatus) {
    throw Conflict('Only rider-returned parcels can be reprocessed for pickup');
  }
  const permission = pickupPermissions.get(parcel.status);
  if (!permission) throw Conflict('Parcel is not eligible to return to office pickup');
  if (!input.permissions.includes(permission))
    throw Forbidden('Missing permission for this home delivery stage');
  if (!delivery) {
    if (parcel.status === ParcelStatus.HOME_DELIVERY_REQUESTED) return parcel;
    throw Conflict('Home delivery record not found');
  }
  if (
    delivery.isDeleted ||
    delivery.mode !== DeliveryMode.DOORSTEP ||
    delivery.deliveredAt ||
    delivery.status === 'DELIVERED_AT_HOME'
  ) {
    throw Conflict('Only unfinished home deliveries can return to office pickup');
  }
  if (
    parcel.status === ParcelStatus.RETURNED_TO_OFFICE &&
    (delivery.status !== 'RETURNED_TO_OFFICE' || !delivery.returnedAt)
  ) {
    throw Conflict('Parcel has no completed rider return');
  }
  if (
    parcel.status === ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER &&
    delivery.status !== 'RIDER_GIVEN_PARCEL_TO_CUSTOMER'
  ) {
    throw Conflict('Parcel is not awaiting delivery cashier confirmation');
  }
  return parcel;
}
