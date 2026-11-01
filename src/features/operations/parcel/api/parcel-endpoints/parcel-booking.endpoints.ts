import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';
import type {
  CreateBookingWithParcelsInput,
  CreateBookingWithParcelsResponse,
  SenderCashierParcel,
  ProcessedParcel,
  ParcelSearchRow,
  ParcelDispositionActionRow,
  HomeDeliveryReceipt,
  ParcelFullDetails,
  SenderCashierParcelFilters,
  ParcelSearchFilters,
} from '../parcel.api';
export const parcelApiPart1 = api.injectEndpoints({
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
    listReturnToSourceParcels: builder.query<
      ServerListResponse<ParcelSearchRow>,
      { page: number; pageSize: number; search?: string }
    >({
      query: (params) => ({ url: '/shipments/parcels/return-to-source', params }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listDeliveryReversalCandidates: builder.query<
      ServerListResponse<ParcelSearchRow>,
      { page?: number; pageSize?: number; search?: string }
    >({
      query: (params) => ({ url: '/shipments/parcels/delivery-reversal-candidates', params }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    previewParcelFinancialRepair: builder.query<
      {
        id: string;
        bookingCode: string;
        trackingCode: string;
        status: number;
        chargeExemptCustomerType?: number | null;
        relatedStaffId?: string | null;
        relatedStaffNameSnapshot?: string | null;
        chargePsw: number;
        activePrincipalPaidPsw: number;
        currentToBePaidPsw: number;
        expectedToBePaidPsw: number;
        needsRepair: boolean;
        canRepair: boolean;
        restriction: string | null;
      },
      { search: string }
    >({
      query: ({ search }) => ({
        url: '/shipments/parcels/financial-repair/preview',
        params: { search },
      }),
    }),
    repairParcelFinancialState: builder.mutation<
      {
        id: string;
        bookingCode: string;
        trackingCode: string;
        previousToBePaidPsw: number;
        plannedToBePaidPsw: number;
      },
      { search: string; reason: string }
    >({
      query: (body) => ({
        url: '/shipments/parcels/financial-repair/execute',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error) => [{ type: 'Bookings', id: 'LIST' }],
    }),
    returnParcelToSource: builder.mutation<
      { id: string; status: number },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/shipments/parcels/${id}/return-to-source`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id },
      ],
    }),
    lookupCallOutcomeReceiver: builder.query<
      { id: string; fullname: string; telephone: string | null; telephone2: string | null } | null,
      string
    >({
      query: (telephone) => ({
        url: `/shipments/parcels/call-center/receiver-lookup/${encodeURIComponent(telephone)}`,
      }),
    }),
    changeCallOutcomeMainReceiver: builder.mutation<
      { id: string; receiverId: string; status: number; receiverName: string },
      {
        id: string;
        telephone: string;
        fullname?: string;
        outcome: 'follow_up' | 'pickup' | 'delivery';
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/call-outcome/change-main-receiver`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    reverseParcelDelivery: builder.mutation<
      { id: string; status: number },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/shipments/parcels/${id}/reverse-delivery`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getParcelDetails: builder.query<ParcelFullDetails, string>({
      query: (id) => ({
        url: `/shipments/parcels/${id}/details`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id }],
    }),
    getHomeDeliveryReceipt: builder.query<HomeDeliveryReceipt, string>({
      query: (id) => ({ url: `/shipments/parcels/${id}/home-delivery-receipt` }),
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
    logParcelStickerPrint: builder.mutation<
      { id: string } | null,
      { bookingCode: string; trackingCode: string; copies?: number }
    >({
      query: (body) => ({
        url: '/shipments/parcels/sticker-prints',
        method: 'POST',
        body,
      }),
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
  }),
});
