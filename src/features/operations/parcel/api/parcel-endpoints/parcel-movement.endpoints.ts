import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';
import type {
  ParcelSearchRow,
  ParcelStorageClearanceRow,
  ParcelStorageClearanceDetail,
  ParcelDiscrepancyRow,
  ParcelReconciliationCaseRow,
  ParcelCorrectionSession,
} from '../parcel.api';
export const parcelApiPart4 = api.injectEndpoints({
  endpoints: (builder) => ({
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
    listParcelStorageClearances: builder.query<
      ServerListResponse<ParcelStorageClearanceRow>,
      ServerListQuery<{
        companyId?: string | null;
        branchId?: string | null;
        statuses?: number[] | null;
      }>
    >({
      query: (query) => ({
        url: '/shipments/parcels/storage-clearances',
        params: buildServerPaginationParams(query),
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    searchStorageClearanceParcels: builder.query<
      ServerListResponse<ParcelSearchRow>,
      { search: string; page: number; pageSize: number }
    >({
      query: (params) => ({ url: '/shipments/parcels/storage-clearances/parcel-search', params }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getStorageClearanceParcelAccrual: builder.query<
      {
        parcelId: string;
        accruedDays: number;
        totalAccruedDays: number;
        dailyRatePsw: number;
        outstandingPsw: number;
      },
      string
    >({
      query: (id) => ({ url: `/shipments/parcels/storage-clearances/parcels/${id}` }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getParcelStorageClearanceDetail: builder.query<ParcelStorageClearanceDetail, string>({
      query: (id) => ({ url: `/shipments/parcels/storage-clearances/${id}` }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    createParcelStorageClearance: builder.mutation<
      { id: string },
      {
        parcelId: string;
        requestedDays?: number | null;
        clearAll?: boolean;
        reason: string;
        evidenceUrl?: string | null;
      }
    >({
      query: (body) => ({
        url: '/shipments/parcels/storage-clearances',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    resubmitParcelStorageClearance: builder.mutation<
      { id: string },
      {
        id: string;
        requestedDays?: number | null;
        clearAll?: boolean;
        reason: string;
        evidenceUrl?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/storage-clearances/${id}/resubmit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    approveParcelStorageClearance: builder.mutation<
      { id: string },
      { id: string; note?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/storage-clearances/${id}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    rejectParcelStorageClearance: builder.mutation<{ id: string }, { id: string; note: string }>({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/storage-clearances/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    returnParcelStorageClearanceForReview: builder.mutation<
      { id: string },
      { id: string; note: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/storage-clearances/${id}/return-for-review`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    executeParcelStorageClearance: builder.mutation<
      { id: string; executedDays: number; executedAmountPsw: number },
      { id: string; note?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/storage-clearances/${id}/execute`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
  }),
});
