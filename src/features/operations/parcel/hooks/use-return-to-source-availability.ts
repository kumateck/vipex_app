import { getReturnToSourceUnavailableReason } from '@/shared/shipments/return-to-source';

export function useReturnToSourceAvailability(
  parcel: { destinationId: string; status: number; isDeleted: boolean },
  branchId: string | null,
  canRecordReturn: boolean,
) {
  return getReturnToSourceUnavailableReason(parcel, branchId, canRecordReturn);
}
