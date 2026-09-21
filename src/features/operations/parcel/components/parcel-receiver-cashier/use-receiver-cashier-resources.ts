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
import {
  getDialogLoadState,
  getDialogResourceState,
  getOutstandingPrincipalPsw,
} from '../../utils';

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
  const cardOptionsQuery = useListCardOptionsQuery();
  const staffOptionsQuery = useListUserOptionsQuery(
    companyId && branchId && cashierLocationId
      ? { companyId, branchId, locationId: cashierLocationId, status: UserStatus.ACTIVE }
      : undefined,
    { skip: !companyId || !branchId || !cashierLocationId || !selectedParcel },
  );
  const branchOptionsQuery = useListBranchOptionsQuery({ companyId }, { skip: !companyId });
  const hasSearchTerm = Boolean(query.search?.trim());
  const listQuery = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId || (!isPickupQueueEnabled && !hasSearchTerm),
  });
  const parcelDetailsQuery = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
    skip: !selectedParcel?.id,
  });
  const pickupLocationQuery = useGetLocationQuery(selectedParcel?.pickupLocationId ?? '', {
    skip: !selectedParcel?.pickupLocationId,
  });
  const mainReceiverCardsQuery = useListCustomerCardsQuery(
    { customerId: selectedParcel?.receiverId ?? '' },
    { skip: !selectedParcel?.receiverId },
  );
  const secondReceiverCardsQuery = useListCustomerCardsQuery(
    { customerId: selectedParcel?.secondReceiverId ?? '' },
    { skip: !selectedParcel?.secondReceiverId },
  );
  const parcelDetails = parcelDetailsQuery.data;
  const dialogLoadState = getDialogLoadState([
    getDialogResourceState(cardOptionsQuery, Boolean(selectedParcel)),
    getDialogResourceState(
      staffOptionsQuery,
      Boolean(selectedParcel && companyId && branchId && cashierLocationId),
    ),
    getDialogResourceState(branchOptionsQuery, Boolean(selectedParcel && companyId)),
    getDialogResourceState(parcelDetailsQuery, Boolean(selectedParcel)),
    getDialogResourceState(pickupLocationQuery, Boolean(selectedParcel?.pickupLocationId)),
    getDialogResourceState(mainReceiverCardsQuery, Boolean(selectedParcel?.receiverId)),
    getDialogResourceState(secondReceiverCardsQuery, Boolean(selectedParcel?.secondReceiverId)),
  ]);

  return {
    cardOptions: cardOptionsQuery.data ?? [],
    staffOptions: staffOptionsQuery.data ?? [],
    branchOptions: branchOptionsQuery.data ?? [],
    listQuery,
    rows: listQuery.data?.data ?? [],
    parcelDetails,
    pickupLocation: pickupLocationQuery.data,
    mainReceiverCards: mainReceiverCardsQuery.data ?? [],
    secondReceiverCards: secondReceiverCardsQuery.data ?? [],
    receiverDuePsw: getOutstandingPrincipalPsw(
      parcelDetails?.parcel.chargePsw ?? selectedParcel?.chargePsw,
      parcelDetails?.payments ?? [],
    ),
    storageOutstandingPsw: parcelDetails?.storageSettlement?.outstandingPsw ?? 0,
    hasPickupQueue: Boolean(parcelDetails?.pickupQueue),
    isDialogDataLoading: dialogLoadState.isLoading,
    hasDialogLoadError: dialogLoadState.hasError,
  };
}
