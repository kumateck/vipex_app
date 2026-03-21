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
  }>;
};

export type CreateBookingWithParcelsResponse = {
  bookingId: string;
  parcels: Array<{ id: string; trackingCode: string; bookingCode: string }>;
  payments: Array<{ id: string }>;
};

export type SenderCashierParcel = {
  id: string;
  destinationId: string;
  destinationName?: string | null;
  pickupLocationId: string | null;
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  senderName: string | null;
  senderPhone: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  chargePsw: number;
  plannedToBePaidPsw: number;
  status: number;
  createdAt: string;
};

export type ProcessedParcel = SenderCashierParcel;

export type ParcelSearchRow = {
  id: string;
  companyId: string;
  sourceId: string;
  destinationId: string;
  destinationName?: string | null;
  consignmentId?: string | null;
  consignmentCode?: string | null;
  consignmentSerialForDay?: number | null;
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
  isDeleted: boolean;
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
  receiverName: string | null;
  receiverPhone: string | null;
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
    isDeleted: boolean;
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

export type SenderCashierParcelFilters = {
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  status?: number | null;
  includeDeleted?: boolean | null;
};

export type ParcelSearchFilters = {
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  status?: number | null;
  statuses?: number[] | null;
  senderPaid?: boolean | null;
  includeDeleted?: boolean | null;
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
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
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
    listProcessedParcelsForConsignment: builder.query<
      ServerListResponse<ProcessedParcel>,
      ServerListQuery<SenderCashierParcelFilters> | void
    >({
      query: (query) => ({
        url: '/shipments/parcels',
        params: buildServerPaginationParams(query),
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
    updateParcelStatus: builder.mutation<{ id: string }, { id: string; status: number }>({
      query: ({ id, status }) => ({
        url: `/shipments/parcels/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    updateParcel: builder.mutation<
      { id: string },
      {
        id: string;
        parcelDetails?: string;
        parcelContent?: string;
        status?: number;
        secondReceiverId?: string | null;
        cardId?: string | null;
        cardNumber?: string | null;
        secondCardId?: string | null;
        secondCardNumber?: string | null;
        confirmedBy?: string | null;
        confirmedAt?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}`,
        method: 'PATCH',
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
  }),
});

export const {
  useCreateBookingWithParcelsMutation,
  useListSenderCashierParcelsQuery,
  useSearchParcelsQuery,
  useLazySearchParcelsQuery,
  useGetParcelDetailsQuery,
  useListProcessedParcelsForConsignmentQuery,
  useCollectSenderPaymentMutation,
  useCreateConsignmentMutation,
  useAddConsignmentItemsMutation,
  useUpdateParcelStatusMutation,
  useUpdateParcelMutation,
  useCollectDoorstepAddressMutation,
  useDispatchDoorstepParcelsMutation,
  useListRiderDoorstepParcelsQuery,
  useRiderGivenParcelToCustomerMutation,
  useRiderReturnParcelToOfficeMutation,
  useFinalizeDoorstepAtOfficeMutation,
} = parcelApi;
