import { ParcelStatus } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';

export function canReadReceiverReceiptReprint(
  user: AuthUser,
  parcel: { companyId: string; destinationId: string; isDeleted: boolean },
) {
  return Boolean(
    user.companyId &&
      user.branchId &&
      !parcel.isDeleted &&
      parcel.companyId === user.companyId &&
      parcel.destinationId === user.branchId,
  );
}

export function isReceiverReceiptReprintEligible(parcel: {
  status: number;
  confirmedAt: Date | null;
}) {
  return parcel.status === ParcelStatus.DELIVERED_BY_OFFICE && parcel.confirmedAt !== null;
}
