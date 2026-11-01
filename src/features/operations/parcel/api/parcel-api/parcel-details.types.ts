import {
  type ParcelSearchRow,
  type ParcelDispositionActionRow,
  type ParcelStorageWaiverRow,
  type ParcelStorageSettlement,
} from './parcel-booking.types';
import { type ParcelInternalHolderSnapshot } from './parcel-exceptions.types';

export type ParcelFullDetails = {
  /** The parcel as list/search rows show it (names, phones, payer totals, rider, holder). */
  summary?: ParcelSearchRow | null;
  parcel: {
    id: string;
    companyId: string;
    sourceId: string;
    destinationId: string;
    bookingId: string;
    bookingCode: string;
    trackingCode: string;
    senderId: string;
    senderNameSnapshot: string;
    receiverId: string;
    receiverNameSnapshot: string;
    secondReceiverId: string | null;
    secondReceiverNameSnapshot: string | null;
    status: number;
    parcelDetails: string;
    parcelContent: string;
    parcelValuePsw: number;
    chargeExemptCustomerType?: number | null;
    relatedStaffId?: string | null;
    relatedStaffNameSnapshot?: string | null;
    chargePsw: number;
    cardId: string | null;
    cardNumber: string | null;
    secondCardId: string | null;
    secondCardNumber: string | null;
    pickupLocationId: string | null;
    plannedToBePaidPsw: number;
    method: number;
    shelfPickerStaffId: string | null;
    taxReportConfirmation: boolean;
    callSender: boolean;
    isDeleted: boolean;
    deletedBy: string | null;
    deletedAt: string | null;
    deleteReason: string | null;
    createdBy: string | null;
    processedBy?: string | null;
    createdAt: string;
    receivedBy: string | null;
    receivedAt: string | null;
    confirmedBy: string | null;
    confirmedAt: string | null;
    updatedAt: string;
    cashierSessionId: string | null;
  };
  /** Full names for every user id referenced in these details. */
  userNames?: Record<string, string>;
  payments: Array<{
    id: string;
    companyId: string;
    branchId: string;
    parcelId: string;
    component: number;
    payer: number;
    cashierType: number;
    method: number;
    cashierUserId: string;
    grossAmountPsw: number;
    netAmountPsw: number;
    vatPsw: number;
    getfundPsw: number;
    nhilPsw: number;
    covidPsw: number;
    taxTotalPsw: number;
    taxComponentKeys: string[];
    receivedAt: string;
    notes: string | null;
    receiptNo: string | null;
    voidedAt: string | null;
    voidedBy: string | null;
    voidReason: string | null;
    createdAt: string;
  }>;
  delivery: null | {
    id: string;
    parcelId: string;
    mode: number;
    status: string;
    officeLocationId: string | null;
    dropoffAddress: string | null;
    frontDeskUserId: string | null;
    deliveryUserId: string | null;
    riderUserId: string | null;
    riderName?: string | null;
    riderAssignedAt?: string | null;
    riderCompletedAt?: string | null;
    returnedAt?: string | null;
    signatureImage: string | null;
    receiverCalledConfirmedBy: string | null;
    receiverCalledConfirmedAt: string | null;
    chargeExemptCustomerType?: number | null;
    relatedStaffId?: string | null;
    relatedStaffNameSnapshot?: string | null;
    chargePsw: number;
    amountPaidPsw: number;
    isDeleted: boolean;
    deliveredAt: string | null;
    confirmedBy: string | null;
    confirmedAt: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    cashierSessionId: string | null;
  };
  consignments: Array<{
    consignmentId: string;
    code: string;
    consignmentDate: string;
    serialForDay: number;
    sourceId: string;
    destinationId: string;
    addedAt: string;
    removedAt: string | null;
  }>;
  pickupQueue: null | {
    id: string;
    companyId: string;
    branchId: string;
    parcelId: string;
    paymentBucket: string;
    queueDate: string;
    queueNumber: number;
    queueCode: string;
    pickerStaffId: string | null;
    idCardTypeId: string | null;
    idCardNumber: string | null;
    queuedBy: string;
    queuedAt: string;
    endedAt: string | null;
    endedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  internalHolder: ParcelInternalHolderSnapshot | null;
  dispositionActions: ParcelDispositionActionRow[];
  storageWaivers: ParcelStorageWaiverRow[];
  storageSettlement: ParcelStorageSettlement;
};

export type PickupQueueRecord = {
  id: string;
  companyId: string;
  branchId: string;
  parcelId: string;
  paymentBucket: string;
  queueDate: string;
  queueNumber: number;
  queueCode: string;
  pickerStaffId: string | null;
  idCardTypeId: string | null;
  idCardNumber: string | null;
  queuedBy: string;
  queuedAt: string;
  endedAt: string | null;
  endedBy: string | null;
  smsSent?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PickupQueueCard = PickupQueueRecord & {
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  plannedToBePaidPsw: number;
  chargeExemptCustomerType?: number | null;
  relatedStaffId?: string | null;
  relatedStaffNameSnapshot?: string | null;
  chargePsw: number;
  callSender: boolean;
  receiverName: string | null;
  receiverPhone: string | null;
};

export type RiderDoorstepRecord = {
  deliveryId: string;
  parcelId: string;
  riderUserId: string | null;
  deliveryStatus: string;
  signatureImage: string | null;
  dropoffAddress: string | null;
  deliveryFeePsw: number;
  amountPaidPsw: number;
  riderCollectedPrincipalPsw: number;
  riderCollectedDeliveryFeePsw: number;
  riderCollectionRecordedAt: string | null;
  principalCollectableAtCompletionPsw: number;
  deliveryFeeCollectableAtCompletionPsw: number;
  trackingCode: string;
  bookingCode: string;
  parcelStatus: number;
  parcelDetails: string;
  parcelContent: string;
  plannedToBePaidPsw: number;
  outstandingPrincipalPsw?: number;
  outstandingDeliveryFeePsw?: number;
  chargeExemptCustomerType?: number | null;
  relatedStaffId?: string | null;
  relatedStaffNameSnapshot?: string | null;
  chargePsw: number;
  destinationId: string;
  destinationName: string | null;
  receiverId: string;
  receiverName: string | null;
  receiverPhone: string | null;
  secondReceiverId: string | null;
  callSender: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RiderDoorstepResponse = {
  rows: RiderDoorstepRecord[];
  totals: {
    expectedDeliveryFeePsw: number;
    expectedToBePaidPsw: number;
    expectedTotalPsw: number;
  };
};
