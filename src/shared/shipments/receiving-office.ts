import { ParcelStatus } from '@/db/schemas/enum-groups/parcels';

export const RECEIVING_OFFICE_STATUSES = [
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
  ParcelStatus.ADDRESS_COLLECTED,
  ParcelStatus.RETURNED_TO_OFFICE,
] as const satisfies readonly number[];

export function canAssignReceivingOffice(status: number) {
  return RECEIVING_OFFICE_STATUSES.some((eligible) => eligible === status);
}

export type ParcelReceivingOffice = {
  pickupLocationId?: string | null;
  pickupLocationName?: string | null;
  receivingOfficeId?: string | null;
  receivingOfficeName?: string | null;
};

export type ReceivingOfficeOption = {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
};

export function pickupOfficeLabel(location?: string | null, office?: string | null) {
  return [location, office].filter(Boolean).join(' → ');
}

export function officesForPickupLocation(
  offices: readonly ReceivingOfficeOption[],
  pickupLocationId: string | null | undefined,
) {
  if (pickupLocationId) return offices.filter((office) => office.locationId === pickupLocationId);
  const [first] = offices;
  return first && offices.every((office) => office.locationId === first.locationId) ? offices : [];
}
