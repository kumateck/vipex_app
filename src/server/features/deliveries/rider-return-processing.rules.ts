import { ParcelStatus } from '@/db/schemas/enums';
import { Conflict, NotFound } from '@/server/utils/http-error';

export function assertRiderReturnReadyForPickup(input: {
  parcel: { companyId: string; destinationId: string; status: number; isDeleted: boolean } | null;
  delivery: { status: string; returnedAt: Date | null } | null;
  companyId: string;
  branchId: string;
}) {
  const { parcel, delivery, companyId, branchId } = input;
  if (
    !parcel ||
    parcel.isDeleted ||
    parcel.companyId !== companyId ||
    parcel.destinationId !== branchId
  ) {
    throw NotFound('Returned parcel not found at this branch');
  }
  if (parcel.status !== ParcelStatus.RETURNED_TO_OFFICE) {
    throw Conflict('Only rider-returned parcels can be reprocessed for pickup');
  }
  if (!delivery || delivery.status !== 'RETURNED_TO_OFFICE' || !delivery.returnedAt) {
    throw Conflict('Parcel has no completed rider return');
  }
}
