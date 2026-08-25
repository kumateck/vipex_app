import { useMemo } from 'react';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListCardOptionsQuery, useListCustomerCardsQuery } from '@/features/customers/api';
import { useGetLocationQuery } from '@/features/locations/api/locations.api';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { UserStatus } from '@/db/schemas/enums';
import type { ServerListQuery } from '@/services/rtk-query';
import {
  type ParcelSearchRow,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
} from '../../api/parcel.api';

export type ParcelReceiverQuery = ServerListQuery<{
  companyId?: string | null;
  destinationId?: string | null;
  status?: number | null;
  senderPaid?: boolean | null;
  hasPickupQueue?: boolean | null;
}>;

type ReceiverCashierResourcesInput = {
  companyId: string | null;
  branchId: string | null;
  cashierLocationId: string | null;
  selectedParcel: ParcelSearchRow | null;
  query: ParcelReceiverQuery;
  isPickupQueueEnabled: boolean;
};

export function useReceiverCashierResources({
  companyId,
  branchId,
  cashierLocationId,
  selectedParcel,
  query,
  isPickupQueueEnabled,
}: ReceiverCashierResourcesInput) {
  const { data: cardOptions = [] } = useListCardOptionsQuery();
  const { data: staffOptions = [] } = useListUserOptionsQuery(
    companyId && branchId && cashierLocationId
      ? { companyId, branchId, locationId: cashierLocationId, status: UserStatus.ACTIVE }
      : undefined,
    { skip: !companyId || !branchId || !cashierLocationId || !selectedParcel },
  );
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const hasSearchTerm = Boolean(query.search?.trim());
  const listQuery = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId || (!isPickupQueueEnabled && !hasSearchTerm),
  });
  const { data: parcelDetails } = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
    skip: !selectedParcel?.id,
  });
  const { data: pickupLocation } = useGetLocationQuery(selectedParcel?.pickupLocationId ?? '', {
    skip: !selectedParcel?.pickupLocationId,
  });
  const { data: mainReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selectedParcel?.receiverId ?? '' },
    { skip: !selectedParcel?.receiverId },
  );
  const { data: secondReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selectedParcel?.secondReceiverId ?? '' },
    { skip: !selectedParcel?.secondReceiverId },
  );
  const principalPaidPsw = useMemo(
    () =>
      (parcelDetails?.payments ?? [])
        .filter((payment) => payment.component === 0)
        .reduce((sum, payment) => sum + payment.grossAmountPsw, 0),
    [parcelDetails?.payments],
  );

  return {
    cardOptions,
    staffOptions,
    branchOptions,
    listQuery,
    rows: listQuery.data?.data ?? [],
    parcelDetails,
    pickupLocation,
    mainReceiverCards,
    secondReceiverCards,
    receiverDuePsw: Math.max((selectedParcel?.plannedToBePaidPsw ?? 0) - principalPaidPsw, 0),
    storageOutstandingPsw: parcelDetails?.storageSettlement?.outstandingPsw ?? 0,
    hasPickupQueue: Boolean(parcelDetails?.pickupQueue),
  };
}
