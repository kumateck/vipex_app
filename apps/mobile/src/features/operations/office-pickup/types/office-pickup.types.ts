import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';

export type CardMode = 'none' | 'existing' | 'new';
export type HandoverTarget = 'main' | 'second';
export type PhoneSlot = 'primary' | 'secondary';
export type OtpChannel = 'sms' | 'whatsapp';

export type PickupParcel = ParcelSearchRow & { pickupQueueEndedAt?: string | null };
export type PickupParcelDetails = ParcelFullDetails;

/** Mirrors GET /v1/branches/:id/operations-settings. */
export type BranchPickupSettings = {
  id: string;
  usePickupQueue: boolean;
  requirePickupOtp: boolean;
  requireReceiverOtp: boolean;
};

/** Signed-in staff scope used to list and hand over parcels. */
export type PickupContext = {
  companyId: string | null;
  branchId: string | null;
  locationId: string | null;
  locationName: string | null;
};

export type PickupStaffOption = { id: string; fullname: string };
export type PickupCardOption = { id: string; name: string };
export type PickupCustomerCard = {
  id: string;
  customerId: string;
  cardId: string;
  cardName: string;
  cardNumber: string;
};

/** ID-card choice for one receiver, matching the web pickup dialog. */
export type CardSelection = {
  mode: CardMode;
  existingRecordId: string;
  newCardTypeId: string;
  newCardNumber: string;
};

export type WhatsAppAvailability = {
  moduleEnabled: boolean;
  configured: boolean;
  available: boolean;
};

export type PickupResources = {
  details: PickupParcelDetails;
  staffOptions: PickupStaffOption[];
  cardOptions: PickupCardOption[];
  mainReceiverCards: PickupCustomerCard[];
  secondReceiverCards: PickupCustomerCard[];
};

export type PickupListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  parcelCode?: string;
  companyId: string;
  destinationId: string;
  status: number;
  cashierCollectionRequired: false;
  hasPickupQueue?: boolean;
  pickupQueueTodayOnly?: boolean;
};

export type SignedPickupConfirmation = {
  handoverTarget: HandoverTarget;
  signatureImage: string;
  expectedMainReceiverId: string;
  expectedSecondReceiverId: string | null;
  confirmedBy: string;
  cardId: string | null;
  cardNumber: string | null;
  secondReceiverId: string | null;
  secondCardId: string | null;
  secondCardNumber: string | null;
  receiverOtpVerificationToken?: string;
};
