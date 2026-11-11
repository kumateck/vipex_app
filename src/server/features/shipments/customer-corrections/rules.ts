import { ParcelStatus } from '@/db/schemas/enums';
import { BadRequest } from '@/server/utils/http-error';
import type { CustomerCorrectionInput } from '@/shared/shipments/parcel-customer-correction';

const editableStatuses = new Set<number>([
  ParcelStatus.CREATED,
  ParcelStatus.PROCESSED,
  ParcelStatus.IN_TRANSIT,
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
  ParcelStatus.ADDRESS_COLLECTED,
  ParcelStatus.DISPATCHED,
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.DISCREPANCY,
  ParcelStatus.AGED_IN_WAREHOUSE,
  ParcelStatus.RETURN_TO_SOURCE,
]);

export function correctionRestriction(parcel: {
  status: number;
  confirmedAt: Date | null;
  deliveryConfirmationSnapshot: unknown;
}) {
  if (
    parcel.confirmedAt ||
    parcel.deliveryConfirmationSnapshot ||
    !editableStatuses.has(parcel.status)
  ) {
    return 'Customer corrections are available only before handover or delivery confirmation on an active parcel.';
  }
  return null;
}

export function normalizeCorrection<T extends CustomerCorrectionInput>(input: T) {
  const fullname = input.fullname.trim();
  const telephone = input.telephone.replace(/[()\s-]/g, '');
  const telephone2 = input.telephone2?.replace(/[()\s-]/g, '') || null;
  const reason = input.reason.trim();
  if (!fullname || fullname.length > 255) throw BadRequest('Name must contain 1 to 255 characters');
  if (!/^\d{10}$/.test(telephone) || (telephone2 && !/^\d{10}$/.test(telephone2))) {
    throw BadRequest('Telephone numbers must contain exactly 10 digits');
  }
  if (telephone === telephone2)
    throw BadRequest('Primary and secondary telephone cannot be the same');
  if (reason.length < 5 || reason.length > 1000)
    throw BadRequest('Enter a reason between 5 and 1000 characters');
  if (input.mode === 'relink' && (!input.customerId || !input.replacementVersion)) {
    throw BadRequest('Look up and select the existing customer before saving');
  }
  return { ...input, fullname, telephone, telephone2, reason };
}
