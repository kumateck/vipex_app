import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export type CreateBookingWithParcelsInput = {
  senderId: string;
  status: number;
  cashierSessionId?: string | null;
  parcels: Array<{
    destinationId: string;
    pickupLocationId?: string | null;
    receiverId: string;
    status: number;
    parcelDetails: string;
    parcelContent: string;
    method: number;
    parcelValueCedis?: number;
    chargeCedis?: number;
    plannedToBePaidCedis?: number;
    senderPaymentCedis?: number;
    senderPaymentMethod?: number;
    paymentResponsibility?: number;
    callSender?: boolean;
  }>;
};

export type CreateBookingWithParcelsResponse = {
  bookingId: string;
  parcels: Array<{ id: string; trackingCode: string; bookingCode: string }>;
  payments: Array<{ id: string }>;
};

export type SenderCashierParcel = {
  id: string;
  sourceId?: string;
  sourceLocationId?: string | null;
  sourceLocationName?: string | null;
  senderId: string;
  receiverId: string;
  destinationId: string;
  destinationName?: string | null;
  pickupLocationId: string | null;
  pickupLocationName?: string | null;
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  parcelContent?: string | null;
  parcelValuePsw?: number | null;
  senderName: string | null;
  senderPhone: string | null;
  senderPhone2?: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverPhone2?: string | null;
  chargePsw: number;
  plannedToBePaidPsw: number;
  status: number;
  createdAt: string;
  currentHolderType?: number | null;
  currentHolderBranchId?: string | null;
  currentHolderBranchName?: string | null;
  currentHolderLocationId?: string | null;
  currentHolderLocationName?: string | null;
  currentHolderWarehouseId?: string | null;
  currentHolderWarehouseName?: string | null;
};

export type ProcessedParcel = SenderCashierParcel;

export type ParcelSearchRow = {
  id: string;
  companyId: string;
  sourceId: string;
  sourceName?: string | null;
  sourceLocationId?: string | null;
  sourceLocationName?: string | null;
  destinationId: string;
  destinationName?: string | null;
  consignmentId?: string | null;
  consignmentCode?: string | null;
  consignmentSerialForDay?: number | null;
  consignmentCreatedAt?: string | null;
  bookingId: string;
  bookingCode: string;
  trackingCode: string;
  senderId: string;
  receiverId: string;
  secondReceiverId: string | null;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  parcelValuePsw: number;
  chargePsw: number;
  cardId: string | null;
  cardNumber: string | null;
  secondCardId: string | null;
  secondCardNumber: string | null;
  pickupLocationId: string | null;
  pickupLocationName?: string | null;
  plannedToBePaidPsw: number;
  method: number;
  taxReportConfirmation: boolean;
  callSender: boolean;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedAt: string | null;
  deleteReason: string | null;
  createdBy: string | null;
  createdAt: string;
  receivedBy: string | null;
  receivedAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  updatedAt: string;
  cashierSessionId: string | null;
  bookingCreatedAt: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderPhone2?: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverPhone2?: string | null;
  secondReceiverName?: string | null;
  secondReceiverPhone?: string | null;
  secondReceiverPhone2?: string | null;
  dropoffAddress?: string | null;
  deliveryFeePsw?: number | null;
  riderUserId?: string | null;
  riderName?: string | null;
  pickupQueueId?: string | null;
  pickupQueueCode?: string | null;
  pickupQueueNumber?: number | null;
  pickupQueuedAt?: string | null;
  pickupQueueEndedAt?: string | null;
  currentHolderType?: number | null;
  currentHolderBranchId?: string | null;
  currentHolderBranchName?: string | null;
  currentHolderLocationId?: string | null;
  currentHolderLocationName?: string | null;
  currentHolderWarehouseId?: string | null;
  currentHolderWarehouseName?: string | null;
  isParcelAgeingEligible?: boolean;
  isParcelAged?: boolean;
  ageingDays?: number | null;
  storageChargeStartAt?: string | null;
  storageChargeDays?: number;
  storageChargePsw?: number;
  storageFeePerDayPsw?: number;
  storageChargeGraceDays?: number;
  ageingThresholdMonths?: number;
};

export type ParcelDispositionActionRow = {
  id: string;
  companyId: string;
  parcelId: string;
  actionType: number;
  warehouseId: string | null;
  warehouseName: string | null;
  notes: string | null;
  recoveredAmountPsw: number;
  performedBy: string;
  performedByName: string | null;
  performedAt: string | null;
  createdAt: string | null;
};

export type ParcelStorageWaiverRow = {
  id: string;
  companyId: string;
  parcelId: string;
  waivedAmountPsw: number;
  reason: string;
  waivedBy: string;
  waivedByName: string | null;
  waivedAt: string | null;
  accountingJournalEntryId: string | null;
  accountingPostedAt: string | null;
  createdAt: string | null;
};

export type ParcelStorageSettlement = {
  parcelId: string;
  accruedPsw: number;
  paidPsw: number;
  waivedPsw: number;
  outstandingPsw: number;
};

export type ParcelDiscrepancyRow = {
  id: string;
  parcelId: string | null;
  branchId: string | null;
  branchName: string | null;
  trackingCode: string | null;
  bookingCode: string | null;
  discrepancyType: string;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  parcelStatus: number | null;
  sourceId: string | null;
  destinationId: string | null;
  pickupLocationId: string | null;
  destinationLocationName: string | null;
  senderName: string | null;
  receiverName: string | null;
};

export type ParcelReconciliationCaseRow = {
  id: string;
  companyId: string;
  parcelId: string;
  linkedParcelId: string | null;
  cashierSessionId: string | null;
  effectiveAt: string | null;
  originalChargePsw: number | null;
  proposedChargePsw: number | null;
  originalPlannedToBePaidPsw: number | null;
  proposedPlannedToBePaidPsw: number | null;
  caseType: number;
  actionType: number | null;
  status: number;
  notes: string | null;
  resolutionNote: string | null;
  evidenceUrl: string | null;
  requestedBy: string;
  requestedByName: string | null;
  requestedAt: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  executedBy: string | null;
  executedByName: string | null;
  executedAt: string | null;
  voidedPaymentCount: number;
  metadata: unknown;
  trackingCode: string;
  bookingCode: string;
  parcelStatus: number;
  sourceId: string;
  destinationId: string;
  currentChargePsw: number;
  currentPlannedToBePaidPsw: number;
  sessionCashierName: string | null;
  sessionScheduledStartTime: string | null;
  sessionScheduledEndTime: string | null;
  sessionStatus: string | null;
  linkedTrackingCode: string | null;
  linkedBookingCode: string | null;
};

export type ParcelCorrectionSession = {
  id: string;
  cashierId: string;
  cashierName: string | null;
  branchId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  status: string;
};

export type ParcelInternalHolderSnapshot = {
  parcelId: string;
  holderType: number;
  branchId: string | null;
  branchName: string | null;
  locationId: string | null;
  locationName: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  updatedAt: string;
};

export type ParcelFullDetails = {
  parcel: {
    id: string;
    companyId: string;
    sourceId: string;
    destinationId: string;
    bookingId: string;
    bookingCode: string;
    trackingCode: string;
    senderId: string;
    receiverId: string;
    secondReceiverId: string | null;
    status: number;
    parcelDetails: string;
    parcelContent: string;
    parcelValuePsw: number;
    chargePsw: number;
    cardId: string | null;
    cardNumber: string | null;
    secondCardId: string | null;
    secondCardNumber: string | null;
    pickupLocationId: string | null;
    plannedToBePaidPsw: number;
    method: number;
    taxReportConfirmation: boolean;
    callSender: boolean;
    isDeleted: boolean;
    deletedBy: string | null;
    deletedAt: string | null;
    deleteReason: string | null;
    createdBy: string | null;
    createdAt: string;
    receivedBy: string | null;
    receivedAt: string | null;
    confirmedBy: string | null;
    confirmedAt: string | null;
    updatedAt: string;
    cashierSessionId: string | null;
  };
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
    signatureImage: string | null;
    receiverCalledConfirmedBy: string | null;
    receiverCalledConfirmedAt: string | null;
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
  trackingCode: string;
  bookingCode: string;
  parcelStatus: number;
  parcelDetails: string;
  parcelContent: string;
  plannedToBePaidPsw: number;
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

export type ParcelInternalTransferRow = {
  id: string;
  companyId: string;
  branchId: string;
  branchName: string | null;
  referenceNo: string | null;
  sourceHolderType: number;
  sourceLocationId: string | null;
  sourceLocationName: string | null;
  sourceWarehouseId: string | null;
  sourceWarehouseName: string | null;
  destinationHolderType: number;
  destinationLocationId: string | null;
  destinationLocationName: string | null;
  destinationWarehouseId: string | null;
  destinationWarehouseName: string | null;
  notes: string | null;
  status: number;
  transferredBy: string;
  transferredByName: string | null;
  transferredAt: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  itemCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ParcelInternalTransferDetails = {
  transfer: ParcelInternalTransferRow & {
    acknowledgedByName?: string | null;
    cancelledBy?: string | null;
    cancelledAt?: string | null;
    cancelReason?: string | null;
  };
  items: Array<{
    parcelId: string;
    trackingCode: string;
    bookingCode: string;
    parcelDetails: string;
    receiverId: string;
    receiverName: string | null;
    receiverPhone: string | null;
    status: number;
    addedAt: string | null;
  }>;
};

export type SenderCashierParcelFilters = {
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  locationId?: string | null;
  status?: number | null;
  includeDeleted?: boolean | null;
};

export type ParcelSearchFilters = {
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  locationId?: string | null;
  status?: number | null;
  statuses?: number[] | null;
  senderPaid?: boolean | null;
  hasPickupQueue?: boolean | null;
  agedOnly?: boolean | null;
  storageChargeAccruing?: boolean | null;
  includeDeleted?: boolean | null;
};

export type IncomingConsignmentRow = {
  id: string;
  code: string;
  sourceId: string;
  sourceName: string;
  destinationId: string;
  consignmentDate: string;
  serialForDay: number;
  status: number;
  closedBy: string | null;
  closedAt: string | null;
  closedWithExceptions: boolean;
  closeExceptionReason: string | null;
  arrived: number;
  total: number;
};

export type ConsignmentDetail = Omit<IncomingConsignmentRow, 'sourceName' | 'arrived' | 'total'> & {
  companyId: string;
  arrived: number;
  total: number;
};

export type ConsignmentItemRow = {
  parcelId: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  senderName: string;
  receiverName: string;
  addedAt: string;
  arrivedAt: string | null;
  arrivedBy: string | null;
  arrivedByName: string | null;
};

export type ReceiveConsignmentItemResult =
  | {
      outcome: 'RECEIVED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      arrived: number;
      total: number;
    }
  | {
      outcome: 'ALREADY_RECEIVED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      arrivedAt: string;
      arrivedByName: string | null;
    }
  | {
      outcome: 'WRONG_CONSIGNMENT';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      belongsToConsignmentId: string | null;
      belongsToConsignmentCode: string | null;
    }
  | {
      outcome: 'NOT_DISPATCHED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      sourceBranchId: string;
      sourceBranchName: string | null;
    };

export type CloseConsignmentResult = {
  status: number;
  arrived: number;
  total: number;
  missingParcelIds: string[];
};

export const parcelApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createBookingWithParcels: builder.mutation<
      CreateBookingWithParcelsResponse,
      CreateBookingWithParcelsInput
    >({
      query: (body) => ({
        url: '/shipments/bookings/create-with-parcels',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    listSenderCashierParcels: builder.query<
      ServerListResponse<SenderCashierParcel>,
      ServerListQuery<SenderCashierParcelFilters> | void
    >({
      query: (query) => ({
        url: '/shipments/parcels',
        params: buildServerPaginationParams(query),
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    searchParcels: builder.query<
      ServerListResponse<ParcelSearchRow>,
      ServerListQuery<ParcelSearchFilters> | void
    >({
      query: (query) => ({
        url: '/shipments/parcels',
        params: buildServerPaginationParams(query),
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getParcelDetails: builder.query<ParcelFullDetails, string>({
      query: (id) => ({
        url: `/shipments/parcels/${id}/details`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id }],
    }),
    listParcelDispositionActions: builder.query<ParcelDispositionActionRow[], string>({
      query: (id) => ({
        url: `/shipments/parcels/${id}/disposition-actions`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id }],
    }),
    recordParcelDispositionAction: builder.mutation<
      { id: string },
      {
        id: string;
        actionType: number;
        notes?: string | null;
        warehouseId?: string | null;
        recoveredAmountCedis?: number | string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/disposition-actions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: arg.id },
      ],
    }),
    waiveParcelStorageAccrual: builder.mutation<
      { id: string },
      { id: string; reason: string; waivedAmountCedis?: number | string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/storage-waivers`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: arg.id },
      ],
    }),
    listProcessedParcelsForConsignment: builder.query<
      ServerListResponse<ProcessedParcel>,
      ServerListQuery<SenderCashierParcelFilters> | void
    >({
      query: (query) => ({
        url: '/shipments/parcels',
        params: {
          ...buildServerPaginationParams(query),
          createdAtOrder: 'desc',
        },
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    collectSenderPayment: builder.mutation<
      {
        id: string;
        amounts: {
          grossPsw: number;
          netPsw: number;
          vatPsw: number;
          getfundPsw: number;
          nhilPsw: number;
          covidPsw: number;
          taxTotalPsw: number;
          grossCedis: number;
          netCedis: number;
          vatCedis: number;
          getfundCedis: number;
          nhilCedis: number;
          covidCedis: number;
          taxTotalCedis: number;
        };
      },
      {
        parcelId: string;
        amountCedis: number;
        method: number;
        component: number;
        payer: number;
        cashierType: number;
      }
    >({
      query: (body) => ({
        url: '/payments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    collectSenderAndProcess: builder.mutation<
      {
        parcelId: string;
        status: number;
        statusChanged: boolean;
        message: string;
        payment: null | {
          id: string;
          amounts: {
            grossPsw: number;
            netPsw: number;
            vatPsw: number;
            getfundPsw: number;
            nhilPsw: number;
            covidPsw: number;
            taxTotalPsw: number;
            grossCedis: number;
            netCedis: number;
            vatCedis: number;
            getfundCedis: number;
            nhilCedis: number;
            covidCedis: number;
            taxTotalCedis: number;
          };
          message?: string;
        };
      },
      {
        parcelId: string;
        amountCedis?: number | null;
        method: number;
        momoTransactionId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/payments/collect-sender-and-process',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    collectReceiverAndDeliver: builder.mutation<
      {
        parcelId: string;
        status: number;
        message: string;
        storageSettlement?: ParcelStorageSettlement;
        payment: null | {
          id: string;
          amounts: {
            grossPsw: number;
            netPsw: number;
            vatPsw: number;
            getfundPsw: number;
            nhilPsw: number;
            covidPsw: number;
            taxTotalPsw: number;
            grossCedis: number;
            netCedis: number;
            vatCedis: number;
            getfundCedis: number;
            nhilCedis: number;
            covidCedis: number;
            taxTotalCedis: number;
          };
          message?: string;
        };
      },
      {
        parcelId: string;
        amountCedis?: number | null;
        method: number;
        confirmedBy: string;
        storageAmountCedis?: number | string | null;
        secondReceiverId?: string | null;
        cardId?: string | null;
        cardNumber?: string | null;
        secondCardId?: string | null;
        secondCardNumber?: string | null;
        receiverOtpVerificationToken: string;
        receiverOtpTarget: 'main' | 'second';
        momoTransactionId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/payments/collect-receiver-and-deliver',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    requestReceiverOtp: builder.mutation<
      { expiresAt: string },
      {
        parcelId: string;
        targetReceiver: 'main' | 'second';
        force?: boolean;
        phoneSlot?: 'primary' | 'secondary';
      }
    >({
      query: (body) => ({
        url: '/payments/receiver-otp/request',
        method: 'POST',
        body,
      }),
    }),
    verifyReceiverOtp: builder.mutation<
      { verificationToken: string; expiresAt: string },
      { parcelId: string; targetReceiver: 'main' | 'second'; otp: string }
    >({
      query: (body) => ({
        url: '/payments/receiver-otp/verify',
        method: 'POST',
        body,
      }),
    }),
    createConsignment: builder.mutation<
      { id: string; code: string; serialForDay: number },
      {
        companyId: string;
        sourceId: string;
        destinationId: string;
        consignmentDate: string;
        createdBy: string;
      }
    >({
      query: (body) => ({
        url: '/shipments/consignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    addConsignmentItems: builder.mutation<
      { added: number },
      {
        consignmentId: string;
        parcelIds: string[];
      }
    >({
      query: ({ consignmentId, parcelIds }) => ({
        url: `/shipments/consignments/${consignmentId}/items`,
        method: 'POST',
        body: { parcelIds },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listIncomingConsignments: builder.query<
      IncomingConsignmentRow[],
      { companyId?: string | null; destinationId?: string | null; statuses?: number[] }
    >({
      query: ({ companyId, destinationId, statuses }) => ({
        url: '/shipments/consignments/incoming',
        params: {
          ...(companyId ? { companyId } : {}),
          ...(destinationId ? { destinationId } : {}),
          ...(statuses ? { statuses } : {}),
        },
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getConsignmentDetail: builder.query<ConsignmentDetail, string>({
      query: (id) => ({ url: `/shipments/consignments/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id: `CONSIGNMENT_${id}` }],
    }),
    listConsignmentItems: builder.query<ConsignmentItemRow[], string>({
      query: (id) => ({ url: `/shipments/consignments/${id}/items` }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id: `CONSIGNMENT_ITEMS_${id}` }],
    }),
    receiveConsignmentItem: builder.mutation<
      ReceiveConsignmentItemResult,
      { consignmentId: string; code: string }
    >({
      query: ({ consignmentId, code }) => ({
        url: `/shipments/consignments/${consignmentId}/receive`,
        method: 'POST',
        body: { code },
      }),
      invalidatesTags: (_result, _error, { consignmentId }) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: `CONSIGNMENT_${consignmentId}` },
        { type: 'Bookings', id: `CONSIGNMENT_ITEMS_${consignmentId}` },
      ],
    }),
    closeConsignment: builder.mutation<
      CloseConsignmentResult,
      { consignmentId: string; forceWithExceptions?: boolean; exceptionReason?: string }
    >({
      query: ({ consignmentId, forceWithExceptions, exceptionReason }) => ({
        url: `/shipments/consignments/${consignmentId}/close`,
        method: 'POST',
        body: { forceWithExceptions, exceptionReason },
      }),
      invalidatesTags: (_result, _error, { consignmentId }) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: `CONSIGNMENT_${consignmentId}` },
        { type: 'Bookings', id: `CONSIGNMENT_ITEMS_${consignmentId}` },
      ],
    }),
    updateParcelStatus: builder.mutation<{ id: string }, { id: string; status: number }>({
      query: ({ id, status }) => ({
        url: `/shipments/parcels/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    markParcelReceived: builder.mutation<
      { id: string; receivedAt: string },
      { id: string; receivedBy: string; status: number }
    >({
      query: ({ id, receivedBy, status }) => ({
        url: `/shipments/parcels/${id}/mark-received`,
        method: 'POST',
        body: { receivedBy, status },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    updateParcel: builder.mutation<
      { id: string },
      {
        id: string;
        destinationId?: string;
        sourceLocationId?: string | null;
        parcelDetails?: string;
        parcelContent?: string;
        status?: number;
        pickupLocationId?: string | null;
        secondReceiverId?: string | null;
        cardId?: string | null;
        cardNumber?: string | null;
        secondCardId?: string | null;
        secondCardNumber?: string | null;
        confirmedBy?: string | null;
        confirmedAt?: string | null;
        receiverOtpVerificationToken?: string;
        receiverOtpTarget?: 'main' | 'second';
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    sendParcelStatusCallNotification: builder.mutation<
      { parcelId: string; trackingCode: string; sentCount: number; failedCount: number },
      {
        parcelId: string;
        outcome: string;
        sendSms?: boolean;
        sendEmail?: boolean;
        includeSecondReceiver?: boolean;
      }
    >({
      query: (body) => ({
        url: '/notification-hub/events/parcel-status-call',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'NotificationHub', id: 'LIST' }],
    }),
    softDeleteParcel: builder.mutation<
      {
        id: string;
        bookingCode: string;
        trackingCode: string;
        reason: string;
        payments: { total: number; voidedNow: number; totalVoided: number; allVoided: boolean };
      },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/shipments/parcels/${id}/soft-delete`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    logParcelDiscrepancy: builder.mutation<
      { success: boolean },
      {
        companyId: string;
        actorUserId?: string | null;
        parcelId?: string | null;
        trackingCode?: string | null;
        bookingCode?: string | null;
        discrepancyType: 'record_not_physical' | 'physical_missing_in_system';
        notes?: string | null;
        branchId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/shipments/parcels/discrepancies',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listOpenParcelDiscrepancies: builder.query<
      ServerListResponse<ParcelDiscrepancyRow>,
      ServerListQuery<{ companyId?: string; branchId?: string | null }>
    >({
      query: (query) => {
        const { page, pageSize, search, filters } = query;
        return {
          url: '/shipments/parcels/discrepancies/open',
          params: buildServerPaginationParams({ page, pageSize, search, filters }),
        };
      },
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    resolveParcelDiscrepancy: builder.mutation<
      { id: string; parcelId: string | null },
      { id: string; resolutionNote?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/discrepancies/${id}/resolve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listParcelReconciliationCases: builder.query<
      ServerListResponse<ParcelReconciliationCaseRow>,
      ServerListQuery<{
        companyId?: string | null;
        branchId?: string | null;
        statuses?: number[] | null;
      }>
    >({
      query: (query) => {
        const { page, pageSize, search, filters } = query;
        return {
          url: '/shipments/parcels/reconciliation-cases',
          params: buildServerPaginationParams({ page, pageSize, search, filters }),
        };
      },
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    requestParcelReconciliationCase: builder.mutation<
      { id: string },
      {
        parcelId: string;
        linkedParcelId?: string | null;
        caseType: number;
        actionType?: number | null;
        notes: string;
        evidenceUrl?: string | null;
        cashierSessionId?: string | null;
        correctedChargeCedis?: number | string | null;
        correctedPlannedToBePaidCedis?: number | string | null;
      }
    >({
      query: (body) => ({
        url: '/shipments/parcels/reconciliation-cases/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getEligibleParcelCorrectionSessions: builder.query<ParcelCorrectionSession[], string>({
      query: (parcelId) => ({
        url: `/shipments/parcels/reconciliation-cases/eligible-sessions/${parcelId}`,
      }),
    }),
    approveParcelReconciliationCase: builder.mutation<
      { id: string },
      { id: string; actionType: number; resolutionNote?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/reconciliation-cases/${id}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    executeParcelReconciliationCase: builder.mutation<
      {
        id: string;
        actionType: number;
        touchedParcelIds: string[];
        voidedPayments: number;
        consignmentItemsUnlinked: number;
      },
      { id: string; executionNote?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/reconciliation-cases/${id}/execute`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    collectDoorstepAddress: builder.mutation<
      { id: string },
      {
        parcelId: string;
        userId: string;
        dropoffAddress: string;
        deliveryFeeCedis: number | string;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/deliveries/dd/${parcelId}/address-collected`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    dispatchDoorstepParcels: builder.mutation<
      { updated: number },
      { parcelIds: string[]; riderUserId: string; userId: string }
    >({
      query: (body) => ({
        url: '/deliveries/dd/dispatch/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listRiderDoorstepParcels: builder.query<
      RiderDoorstepResponse,
      { riderUserId: string; mode?: 'current' | 'history' }
    >({
      query: ({ riderUserId, mode = 'current' }) => ({
        url: `/deliveries/dd/rider/${riderUserId}`,
        params: { mode },
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    riderGivenParcelToCustomer: builder.mutation<
      { id: string },
      {
        parcelId: string;
        riderUserId: string;
        signatureImage: string;
        secondReceiverId?: string | null;
        cardId?: string | null;
        cardNumber?: string | null;
        secondCardId?: string | null;
        secondCardNumber?: string | null;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/deliveries/dd/${parcelId}/rider-given`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    riderReturnParcelToOffice: builder.mutation<
      { id: string },
      { parcelId: string; riderUserId: string }
    >({
      query: ({ parcelId, riderUserId }) => ({
        url: `/deliveries/dd/${parcelId}/returned`,
        method: 'POST',
        body: { riderUserId },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    finalizeDoorstepAtOffice: builder.mutation<
      { id: string },
      {
        parcelId: string;
        cashierUserId: string;
        branchId: string;
        companyId: string;
        principalAmountCedis?: number | string | null;
        deliveryFeeAmountCedis?: number | string | null;
        method: number;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/deliveries/dd/${parcelId}/finalize-at-office`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),
    createPickupQueue: builder.mutation<
      PickupQueueRecord,
      {
        parcelId: string;
        pickerStaffId?: string | null;
        idCardTypeId?: string | null;
        idCardNumber?: string | null;
        sendSms?: boolean;
      }
    >({
      query: (body) => ({
        url: '/pickup-queues',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listPickupQueueCards: builder.query<
      PickupQueueCard[],
      { branchId: string; paymentBucket?: 'SP' | 'TP' }
    >({
      query: ({ branchId, paymentBucket }) => ({
        url: `/pickup-queues/branch/${branchId}/cards`,
        params: paymentBucket ? { paymentBucket } : undefined,
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listParcelInternalTransfers: builder.query<
      ParcelInternalTransferRow[],
      {
        branchId?: string;
        status?: number;
        destinationLocationId?: string;
        destinationWarehouseId?: string;
        sourceLocationId?: string;
        sourceWarehouseId?: string;
      } | void
    >({
      query: (params) => ({
        url: '/shipments/parcel-internal-transfers',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getParcelInternalTransferDetails: builder.query<ParcelInternalTransferDetails, string>({
      query: (id) => ({
        url: `/shipments/parcel-internal-transfers/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id: `INTERNAL_TRANSFER_${id}` }],
    }),
    createParcelInternalTransfer: builder.mutation<
      { id: string },
      {
        branchId: string;
        sourceHolderType: number;
        sourceLocationId?: string | null;
        sourceWarehouseId?: string | null;
        destinationHolderType: number;
        destinationLocationId?: string | null;
        destinationWarehouseId?: string | null;
        notes?: string | null;
        parcelIds: string[];
      }
    >({
      query: (body) => ({
        url: '/shipments/parcel-internal-transfers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    acknowledgeParcelInternalTransfer: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/shipments/parcel-internal-transfers/${id}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: `INTERNAL_TRANSFER_${id}` },
      ],
    }),
    cancelParcelInternalTransfer: builder.mutation<
      { id: string },
      { id: string; cancelReason: string }
    >({
      query: ({ id, cancelReason }) => ({
        url: `/shipments/parcel-internal-transfers/${id}/cancel`,
        method: 'POST',
        body: { cancelReason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: `INTERNAL_TRANSFER_${id}` },
      ],
    }),
  }),
});

export const {
  useCreateBookingWithParcelsMutation,
  useListSenderCashierParcelsQuery,
  useSearchParcelsQuery,
  useLazySearchParcelsQuery,
  useGetParcelDetailsQuery,
  useLazyGetParcelDetailsQuery,
  useListParcelDispositionActionsQuery,
  useListProcessedParcelsForConsignmentQuery,
  useCollectSenderPaymentMutation,
  useCollectSenderAndProcessMutation,
  useCollectReceiverAndDeliverMutation,
  useRequestReceiverOtpMutation,
  useVerifyReceiverOtpMutation,
  useCreateConsignmentMutation,
  useAddConsignmentItemsMutation,
  useListIncomingConsignmentsQuery,
  useGetConsignmentDetailQuery,
  useListConsignmentItemsQuery,
  useReceiveConsignmentItemMutation,
  useCloseConsignmentMutation,
  useUpdateParcelStatusMutation,
  useMarkParcelReceivedMutation,
  useUpdateParcelMutation,
  useSendParcelStatusCallNotificationMutation,
  useRecordParcelDispositionActionMutation,
  useWaiveParcelStorageAccrualMutation,
  useSoftDeleteParcelMutation,
  useLogParcelDiscrepancyMutation,
  useListOpenParcelDiscrepanciesQuery,
  useResolveParcelDiscrepancyMutation,
  useListParcelReconciliationCasesQuery,
  useGetEligibleParcelCorrectionSessionsQuery,
  useRequestParcelReconciliationCaseMutation,
  useApproveParcelReconciliationCaseMutation,
  useExecuteParcelReconciliationCaseMutation,
  useCollectDoorstepAddressMutation,
  useDispatchDoorstepParcelsMutation,
  useListRiderDoorstepParcelsQuery,
  useRiderGivenParcelToCustomerMutation,
  useRiderReturnParcelToOfficeMutation,
  useFinalizeDoorstepAtOfficeMutation,
  useCreatePickupQueueMutation,
  useListPickupQueueCardsQuery,
  useListParcelInternalTransfersQuery,
  useGetParcelInternalTransferDetailsQuery,
  useCreateParcelInternalTransferMutation,
  useAcknowledgeParcelInternalTransferMutation,
  useCancelParcelInternalTransferMutation,
} = parcelApi;
