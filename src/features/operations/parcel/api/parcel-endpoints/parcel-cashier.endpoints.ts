import { api } from '@/services/api';

import type {
  IncomingConsignmentRow,
  ConsignmentDetail,
  ConsignmentItemRow,
  PreviousConsignmentRow,
  SavedConsignmentPrintPayload,
  ReceiveConsignmentItemResult,
  CloseConsignmentResult,
} from '../parcel.api';
export const parcelApiPart3 = api.injectEndpoints({
  endpoints: (builder) => ({
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
    listPreviousConsignments: builder.query<
      PreviousConsignmentRow[],
      { dateFrom: string; dateTo: string; sourceId?: string | null }
    >({
      query: ({ dateFrom, dateTo, sourceId }) => ({
        url: '/shipments/consignments/history',
        params: { dateFrom, dateTo, ...(sourceId ? { sourceId } : {}) },
      }),
      providesTags: [{ type: 'Bookings', id: 'CONSIGNMENT_HISTORY' }],
    }),
    getSavedConsignmentPrintPayload: builder.query<SavedConsignmentPrintPayload, string>({
      query: (id) => ({ url: `/shipments/consignments/${id}/print` }),
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
    markParcelsReceived: builder.mutation<
      { parcelIds: string[]; updatedCount: number; receivedAt: string },
      { parcelIds: string[] }
    >({
      query: (body) => ({
        url: '/shipments/parcels/bulk-mark-received',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    saveBulkCallOutcome: builder.mutation<
      { parcelIds: string[]; updatedCount: number; status: number },
      { parcelIds: string[]; outcome: 'follow_up' | 'pickup' | 'delivery' }
    >({
      query: (body) => ({
        url: '/shipments/parcels/bulk-call-outcome',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    recordCallCenterContact: builder.mutation<
      { id: string; status: number; calledAt: string },
      {
        id: string;
        outcome?: 'follow_up' | 'pickup' | 'delivery';
        secondReceiverId?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/call-center/contact`,
        method: 'POST',
        body,
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
  }),
});
