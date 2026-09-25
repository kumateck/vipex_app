import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { resolveSecondReceiver, mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import type { ContactOutcome, SaveCallOutcomeInput } from '../types';

type ParcelListResponse = {
  data: ParcelSearchRow[];
  meta?: { totalRecords?: number; totalPages?: number };
};

export function listAssignedCallParcels(token: string, search: string) {
  return mobileApiGet<ParcelListResponse>({
    path: '/shipments/parcels/call-center/assigned',
    token,
    query: { page: 1, pageSize: 100, search },
  });
}

export function listAddressCollectionParcels(token: string, input: { search: string }) {
  return mobileApiGet<ParcelListResponse>({
    path: '/shipments/parcels/call-center/address-collection',
    token,
    query: { page: 1, pageSize: 50, search: input.search },
  });
}

export async function saveCallOutcome(token: string, input: SaveCallOutcomeInput) {
  let secondReceiverId = input.existingSecondReceiverId;
  if (input.secondReceiver) {
    const customer = await resolveSecondReceiver(token, input.secondReceiver);
    secondReceiverId = customer.id;
  }

  await mobileApiPost({
    path: `/shipments/parcels/${input.parcelId}/call-center/contact`,
    token,
    body: { outcome: input.outcome, secondReceiverId },
  });

  if (!input.sendSms && !input.sendEmail) {
    return { sentCount: 0, failedCount: 0, notificationError: null };
  }

  try {
    const result = await mobileApiPost<{
      sentCount: number;
      failedCount: number;
    }>({
      path: '/notification-hub/events/parcel-status-call',
      token,
      body: {
        parcelId: input.parcelId,
        outcome: input.outcome,
        sendSms: input.sendSms,
        sendEmail: input.sendEmail,
        includeSecondReceiver: Boolean(secondReceiverId),
      },
    });
    return { ...result, notificationError: null };
  } catch (error) {
    return {
      sentCount: 0,
      failedCount: 0,
      notificationError: getMobileErrorMessage(error, '') || 'Notification failed.',
    };
  }
}

export const markAssignedParcelCalled = (token: string, parcelId: string) =>
  mobileApiPost<{ id: string }>({
    path: `/shipments/parcels/${parcelId}/call-center/contact`,
    token,
    body: {},
  });

export function outcomeStatus(outcome: ContactOutcome) {
  if (outcome === 'pickup') return ParcelStatus.AWAITING_PICKUP;
  if (outcome === 'delivery') return ParcelStatus.HOME_DELIVERY_REQUESTED;
  return ParcelStatus.AWAITING_PICKUP;
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
