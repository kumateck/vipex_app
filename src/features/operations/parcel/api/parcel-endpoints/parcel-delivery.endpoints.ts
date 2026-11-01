import { api } from '@/services/api';

import type {
  PickupQueueRecord,
  PickupQueueCard,
  RiderDoorstepResponse,
  ParcelInternalTransferRow,
  ParcelInternalTransferDetails,
} from '../parcel.api';
export const parcelApiPart5 = api.injectEndpoints({
  endpoints: (builder) => ({
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
    listPaymentsForParcel: builder.query<
      Array<{
        id: string;
        parcelId: string;
        component: number;
        payer: number;
        grossAmountPsw: number;
        netAmountPsw: number;
        vatPsw: number;
        getfundPsw: number;
        nhilPsw: number;
        covidPsw: number;
        taxTotalPsw: number;
      }>,
      { parcelId: string }
    >({
      query: ({ parcelId }) => ({
        url: `/payments/by-parcel/${parcelId}`,
      }),
    }),
  }),
});
