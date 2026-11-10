import { getParcelDetails, mobileApiGet, mobileApiPatch, mobileApiPost } from '@mobile/lib/api';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import type {
  BranchPickupSettings,
  SignedPickupConfirmation,
  OtpChannel,
  PhoneSlot,
  PickupCardOption,
  PickupContext,
  PickupCustomerCard,
  PickupListQuery,
  PickupParcel,
  PickupResources,
  PickupStaffOption,
  WhatsAppAvailability,
} from '../types';

const ACTIVE_USER_STATUS = 0;

export function getBranchPickupSettings(token: string, branchId: string) {
  return mobileApiGet<BranchPickupSettings>({
    path: `/branches/${branchId}/operations-settings`,
    token,
  });
}

export function getWhatsAppAvailability(token: string) {
  return mobileApiGet<WhatsAppAvailability>({ path: '/whatsapp/availability', token });
}

export function listPickupParcels(token: string, query: PickupListQuery) {
  return mobileApiGet<{ data: PickupParcel[] }>({
    path: '/shipments/parcels',
    token,
    query,
  });
}

function listCustomerCards(token: string, customerId: string | null | undefined) {
  if (!customerId) return Promise.resolve<PickupCustomerCard[]>([]);
  return mobileApiGet<PickupCustomerCard[]>({ path: `/customers/${customerId}/cards`, token });
}

/** Staff at the cashier's own location, as the web shelf-picker list shows. */
function listLocationStaff(token: string, context: PickupContext) {
  if (!context.companyId || !context.branchId || !context.locationId) {
    return Promise.resolve<PickupStaffOption[]>([]);
  }
  return mobileApiGet<PickupStaffOption[]>({
    path: '/users/options',
    token,
    query: {
      companyId: context.companyId,
      branchId: context.branchId,
      locationId: context.locationId,
      status: ACTIVE_USER_STATUS,
    },
  });
}

/** Everything the handover form needs for one parcel, fetched in parallel. */
export async function loadPickupResources(
  token: string,
  parcel: PickupParcel,
  context: PickupContext,
): Promise<PickupResources> {
  const [details, staffOptions, cardOptions, mainReceiverCards, secondReceiverCards] =
    await Promise.all([
      getParcelDetails(token, parcel.id),
      listLocationStaff(token, context),
      mobileApiGet<PickupCardOption[]>({ path: '/customers/cards/options', token }),
      listCustomerCards(token, parcel.receiverId),
      listCustomerCards(token, parcel.secondReceiverId),
    ]);
  return { details, staffOptions, cardOptions, mainReceiverCards, secondReceiverCards };
}

export function requestPickupOtp(
  token: string,
  input: { parcelId: string; force: boolean; phoneSlot: PhoneSlot; channel: OtpChannel },
) {
  return mobileApiPost<{ expiresAt: string; channel?: OtpChannel }>({
    path: '/payments/receiver-otp/request',
    token,
    body: { ...input, targetReceiver: 'main' },
  });
}

export function verifyPickupOtp(token: string, input: { parcelId: string; otp: string }) {
  return mobileApiPost<{ verificationToken: string; expiresAt: string }>({
    path: '/payments/receiver-otp/verify',
    token,
    body: { ...input, targetReceiver: 'main' },
  });
}

export function addPickupCustomerCard(
  token: string,
  input: { customerId: string; cardId: string; cardNumber: string },
) {
  const { customerId, ...body } = input;
  return mobileApiPost<{ id: string }>({ path: `/customers/${customerId}/cards`, token, body });
}

export function resolvePickupSecondReceiver(
  token: string,
  input: { fullname: string; telephone: string },
) {
  return mobileApiPost<{ id: string }>({
    path: '/customers/resolve-second-receiver',
    token,
    body: input,
  });
}

export function markParcelDeliveredByOffice(
  token: string,
  parcelId: string,
  confirmation: SignedPickupConfirmation,
) {
  return mobileApiPost<{ id: string }>({
    path: `/shipments/parcels/${parcelId}/confirm-office-pickup`,
    token,
    body: confirmation,
  });
}

export function requestParcelHomeDelivery(token: string, parcelId: string) {
  return mobileApiPatch<{ id: string }>({
    path: `/shipments/parcels/${parcelId}`,
    token,
    body: { status: ParcelStatus.HOME_DELIVERY_REQUESTED },
  });
}
