import { mobileApiPost, searchParcels } from '@mobile/lib/api';
import { ParcelStatus } from '@mobile/constants/parcel-status';

export function listAddressCollectionParcels(
  token: string,
  input: { companyId: string; branchId: string; search: string },
) {
  return searchParcels(token, {
    search: input.search,
    companyId: input.companyId,
    destinationId: input.branchId,
    status: ParcelStatus.HOME_DELIVERY_REQUESTED,
    pageSize: 50,
  });
}

export const markReceiverCalled = (token: string, parcelId: string, userId: string) =>
  mobileApiPost<{ id: string }>({
    path: `/deliveries/dd/${parcelId}/call`,
    token,
    body: { userId },
  });

export const collectDoorstepAddress = (
  token: string,
  input: { parcelId: string; userId: string; dropoffAddress: string; deliveryFeeCedis: string },
) =>
  mobileApiPost<{ id: string }>({
    path: `/deliveries/dd/${input.parcelId}/address-collected`,
    token,
    body: {
      userId: input.userId,
      dropoffAddress: input.dropoffAddress,
      deliveryFeeCedis: input.deliveryFeeCedis,
    },
  });
