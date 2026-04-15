import { api } from '@/services/api';
import { buildServerPaginationParams } from '@/services/rtk-query/pagination';
import { invalidateEntityListTag, provideEntityListTags } from '@/services/rtk-query/tags';
import type { ServerListQuery, ServerListResponse } from '@/services/rtk-query/types';
import { useAuthStore } from '@/stores/auth-store';
import type {
  InventoryDashboardSummary,
  StockMaintenanceCreateInput,
  StockMaintenanceListQuery,
  StockMaintenanceRecord,
  StockMaintenanceResolveInput,
  StockRequestAllocation,
  StockRequest,
  StockRequestCreateInput,
  StockRequestFulfillLineInput,
  StockRequestLineAcknowledgeInput,
  StockRequestListQuery,
  StockRequestRejectInput,
  StockAdjustment,
  StockAdjustmentCreateInput,
  StockAdjustmentListQuery,
  StockLevel,
  StockLevelListQuery,
  StockMovement,
  StockMovementCreateInput,
  StockMovementListQuery,
  StockTransfer,
  StockTransferAcknowledgeReceiptInput,
  StockTransferCreateInput,
  StockTransferListQuery,
  StockTransferUpdateInput,
  StockAllocationPolicy,
  StockAllocationPolicyUpsertInput,
  StockReservation,
  StockReservationListQuery,
  StockReservationExceptionsSummary,
  StockLot,
  StockLotCreateInput,
  StockLotExpiryAlerts,
  StockLotListQuery,
  StockLotTraceability,
  StockLotAnalytics,
  StockCountSession,
  StockCountSessionListQuery,
  StockCountSessionCreateInput,
  InventoryMonitoringSummary,
  ReorderSuggestionsResponse,
  InventoryReorderPolicy,
  InventoryReorderPolicyUpsertInput,
  InventoryApprovalPolicy,
  InventoryApprovalPolicyCreateInput,
  InventoryApprovalRequest,
  InventoryApprovalRequestCreateInput,
  InventoryApprovalDecisionInput,
  InventoryValuationSummary,
  ReplenishmentProposal,
  ReplenishmentProposalDetail,
  ReplenishmentProposalCreateInput,
  InventoryTask,
  InventoryTaskDetail,
  InventoryTaskCreateInput,
  InventoryTaskScanInput,
  InventoryEventJournalRow,
  InventoryCorrectionInput,
  InventoryEnterpriseKpis,
} from '@/features/inventory/stock/types/inventory-stock.types';
import {
  toCreateStockMaintenancePayload,
  toCreateStockRequestPayload,
  toCreateStockAdjustmentPayload,
  toCreateStockMovementPayload,
  toCreateStockTransferPayload,
  toFulfillStockRequestLinePayload,
  toRejectStockRequestPayload,
  toResolveStockMaintenancePayload,
  toCreateStockLotPayload,
  toUpdateStockTransferPayload,
} from '@/features/inventory/stock/utils/inventory-stock-payload';

export interface InventoryCategory {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryProduct {
  id: string;
  companyId: string;
  categoryId?: string;
  sku: string;
  name: string;
  description?: string;
  unitOfMeasure: number;
  isRecoverable: boolean;
  minStockLevel: string; // from server as string or number; prefer string for bigint
  createdAt: string;
  updatedAt: string;
}

export interface InventoryProductFilters {
  companyId?: string | null;
  categoryId?: string | null;
}

export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listProducts: builder.query<
      ServerListResponse<InventoryProduct>,
      ServerListQuery<InventoryProductFilters> | void
    >({
      query: (query) => ({
        url: '/inventory/products',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getProduct: builder.query<InventoryProduct, string>({
      query: (id) => ({ url: `/inventory/products/${id}` }),
      providesTags: (result) => (result ? [{ type: 'Inventory', id: result.id }] : ['Inventory']),
    }),
    createProduct: builder.mutation<
      { id: string },
      Omit<InventoryProduct, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (body) => ({ url: '/inventory/products', method: 'POST', body }),
      invalidatesTags: ['Inventory'],
    }),
    listStockLevels: builder.query<ServerListResponse<StockLevel>, StockLevelListQuery | void>({
      query: (query) => ({
        url: '/inventory/stock-levels',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockLevel: builder.query<StockLevel, { productId: string; locationId: string }>({
      query: ({ productId, locationId }) => ({
        url: `/inventory/stock-levels/${productId}/${locationId}`,
      }),
      providesTags: (result) => (result ? [{ type: 'Inventory', id: result.id }] : ['Inventory']),
    }),
    listStockLots: builder.query<ServerListResponse<StockLot>, StockLotListQuery | void>({
      query: (query) => ({
        url: '/inventory/stock-lots',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockLot: builder.query<StockLot, string>({
      query: (id) => ({ url: `/inventory/stock-lots/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    getStockLotTraceability: builder.query<StockLotTraceability, string>({
      query: (id) => ({ url: `/inventory/stock-lots/${id}/traceability` }),
      providesTags: (_result, _err, id) => [
        { type: 'Inventory', id: `stock-lot-traceability-${id}` },
      ],
    }),
    getStockLotAnalytics: builder.query<
      StockLotAnalytics,
      {
        companyId: string;
        daysAhead?: number;
        issueLookbackDays?: number;
        locationId?: string | null;
      }
    >({
      query: ({ companyId, daysAhead, issueLookbackDays, locationId }) => ({
        url: '/inventory/stock-lots/analytics',
        params: {
          companyId,
          daysAhead: daysAhead ?? undefined,
          issueLookbackDays: issueLookbackDays ?? undefined,
          locationId: locationId ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'STOCK_LOT_ANALYTICS' }],
    }),
    getInventoryMonitoringSummary: builder.query<
      InventoryMonitoringSummary,
      { companyId: string; daysAhead?: number; issueLookbackDays?: number }
    >({
      query: ({ companyId, daysAhead, issueLookbackDays }) => ({
        url: '/inventory/monitoring/summary',
        params: {
          companyId,
          daysAhead: daysAhead ?? undefined,
          issueLookbackDays: issueLookbackDays ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_MONITORING_SUMMARY' }],
    }),
    runInventoryDailyAutomation: builder.mutation<
      {
        message: string;
        sweep: { expiredCount: number; sweptAt: string };
      },
      {
        companyId: string;
        daysAhead?: number;
        sendEmailAlerts?: boolean;
        recipientEmails?: string[];
      }
    >({
      query: ({ companyId, daysAhead, sendEmailAlerts, recipientEmails }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/automation/run-daily',
          method: 'POST',
          body: {
            companyId,
            actorUserId: user.id,
            daysAhead: daysAhead ?? undefined,
            sendEmailAlerts: sendEmailAlerts ?? true,
            recipientEmails: recipientEmails ?? [],
          },
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    listStockCountSessions: builder.query<
      ServerListResponse<StockCountSession>,
      StockCountSessionListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-count-sessions',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockCountSession: builder.query<StockCountSession, string>({
      query: (id) => ({ url: `/inventory/stock-count-sessions/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    createStockCountSession: builder.mutation<{ id: string }, StockCountSessionCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-count-sessions',
          method: 'POST',
          body: {
            companyId: user.company.id,
            locationId: body.locationId,
            notes: body.notes ?? undefined,
            productIds: body.productIds ?? [],
            createdBy: user.id,
          },
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    updateStockCountSessionLine: builder.mutation<
      { id: string },
      { sessionId: string; lineId: string; countedQuantity: string; varianceReason?: string }
    >({
      query: ({ sessionId, lineId, countedQuantity, varianceReason }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-count-sessions/${sessionId}/lines/${lineId}`,
          method: 'PATCH',
          body: {
            countedQuantity,
            varianceReason: varianceReason ?? undefined,
            countedBy: user.id,
          },
        };
      },
      invalidatesTags: (_r, _e, { sessionId }) => [
        { type: 'Inventory', id: sessionId },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    submitStockCountSession: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-count-sessions/${id}/submit`,
          method: 'POST',
          body: { submittedBy: user.id },
        };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    approveStockCountSession: builder.mutation<
      { id: string },
      { id: string; applyAdjustments?: boolean }
    >({
      query: ({ id, applyAdjustments }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-count-sessions/${id}/approve`,
          method: 'POST',
          body: { approvedBy: user.id, applyAdjustments: applyAdjustments ?? true },
        };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    createStockLot: builder.mutation<{ id: string }, StockLotCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-lots',
          method: 'POST',
          body: toCreateStockLotPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    updateStockLotStatus: builder.mutation<
      { id: string },
      { id: string; status?: number; notes?: string }
    >({
      query: ({ id, status, notes }) => ({
        url: `/inventory/stock-lots/${id}/status`,
        method: 'PATCH',
        body: {
          ...(status !== undefined ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    runStockLotExpirySweep: builder.mutation<
      { expiredCount: number; sweptAt: string },
      { companyId: string }
    >({
      query: ({ companyId }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-lot-expiry/sweep',
          method: 'POST',
          body: {
            companyId,
            actorUserId: user.id,
          },
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    getStockLotExpiryAlerts: builder.query<
      StockLotExpiryAlerts,
      { companyId: string; daysAhead?: number; locationId?: string | null }
    >({
      query: ({ companyId, daysAhead, locationId }) => ({
        url: '/inventory/stock-lot-expiry/alerts',
        params: {
          companyId,
          daysAhead: daysAhead ?? undefined,
          locationId: locationId ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'STOCK_LOT_EXPIRY_ALERTS' }],
    }),
    listStockMovements: builder.query<
      ServerListResponse<StockMovement>,
      StockMovementListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-movements',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    createStockMovement: builder.mutation<{ id: string }, StockMovementCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-movements',
          method: 'POST',
          body: toCreateStockMovementPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    listStockAdjustments: builder.query<
      ServerListResponse<StockAdjustment>,
      StockAdjustmentListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-adjustments',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    createStockAdjustment: builder.mutation<{ id: string }, StockAdjustmentCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-adjustments',
          method: 'POST',
          body: toCreateStockAdjustmentPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    listStockTransfers: builder.query<
      ServerListResponse<StockTransfer>,
      StockTransferListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-transfers',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockTransfer: builder.query<StockTransfer, string>({
      query: (id) => ({ url: `/inventory/stock-transfers/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    createStockTransfer: builder.mutation<{ id: string }, StockTransferCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-transfers',
          method: 'POST',
          body: toCreateStockTransferPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    updateStockTransfer: builder.mutation<
      { id: string },
      { id: string; body: StockTransferUpdateInput }
    >({
      query: ({ id, body }) => {
        const user = useAuthStore.getState().user;
        return {
          url: `/inventory/stock-transfers/${id}`,
          method: 'PATCH',
          body: toUpdateStockTransferPayload(body, {
            completedBy: user?.id,
          }),
        };
      },
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    acknowledgeStockTransferReceipt: builder.mutation<
      {
        id: string;
        acceptedQuantity: number;
        damagedQuantity: number;
        missingQuantity: number;
        netReceived: number;
        pendingToAcknowledge: number;
      },
      { transferId: string; body: StockTransferAcknowledgeReceiptInput }
    >({
      query: ({ transferId, body }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-transfers/${transferId}/acknowledge-receipt`,
          method: 'POST',
          body: {
            ...body,
            acknowledgedBy: user.id,
          },
        };
      },
      invalidatesTags: (_result, _err, { transferId }) => [
        { type: 'Inventory', id: transferId },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    listStockRequests: builder.query<
      ServerListResponse<StockRequest>,
      StockRequestListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-requests',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockRequest: builder.query<StockRequest, string>({
      query: (id) => ({ url: `/inventory/stock-requests/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    createStockRequest: builder.mutation<{ id: string }, StockRequestCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-requests',
          method: 'POST',
          body: toCreateStockRequestPayload(body, {
            companyId: user.company.id,
            requestedBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    submitStockRequest: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/inventory/stock-requests/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    approveStockRequest: builder.mutation<{ id: string }, string>({
      query: (id) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-requests/${id}/approve`,
          method: 'POST',
          body: { approvedBy: user.id },
        };
      },
      invalidatesTags: (_result, _err, id) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    rejectStockRequest: builder.mutation<
      { id: string },
      { id: string; body: StockRequestRejectInput }
    >({
      query: ({ id, body }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-requests/${id}/reject`,
          method: 'POST',
          body: toRejectStockRequestPayload(body, { rejectedBy: user.id }),
        };
      },
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    fulfillStockRequestLine: builder.mutation<
      { id: string },
      { requestId: string; body: StockRequestFulfillLineInput }
    >({
      query: ({ requestId, body }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-requests/${requestId}/fulfill`,
          method: 'POST',
          body: toFulfillStockRequestLinePayload(body, { fulfilledBy: user.id }),
        };
      },
      invalidatesTags: (_result, _err, { requestId }) => [
        { type: 'Inventory', id: requestId },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    getStockRequestLineAllocation: builder.query<
      StockRequestAllocation,
      { requestId: string; lineId: string }
    >({
      query: ({ requestId, lineId }) => ({
        url: `/inventory/stock-requests/${requestId}/allocation`,
        params: { lineId },
      }),
      providesTags: (_result, _err, { requestId, lineId }) => [
        { type: 'Inventory', id: requestId },
        { type: 'Inventory', id: `stock-request-allocation-${lineId}` },
      ],
    }),
    autoFulfillStockRequestLine: builder.mutation<
      { id: string; fulfilledQuantity: number; remainingQuantity: number },
      { requestId: string; lineId: string; notes?: string }
    >({
      query: ({ requestId, lineId, notes }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-requests/${requestId}/auto-fulfill`,
          method: 'POST',
          body: {
            lineId,
            fulfilledBy: user.id,
            ...(notes ? { notes } : {}),
          },
        };
      },
      invalidatesTags: (_result, _err, { requestId, lineId }) => [
        { type: 'Inventory', id: requestId },
        { type: 'Inventory', id: `stock-request-allocation-${lineId}` },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    acknowledgeStockRequestLine: builder.mutation<
      {
        id: string;
        requestId: string;
        lineId: string;
        fulfilledQuantity: number;
        acknowledgedQuantity: number;
        pendingAcknowledgementQuantity: number;
      },
      { requestId: string; body: StockRequestLineAcknowledgeInput }
    >({
      query: ({ requestId, body }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-requests/${requestId}/lines/${body.lineId}/acknowledge`,
          method: 'POST',
          body: {
            acknowledgedQuantity: body.acknowledgedQuantity,
            notes: body.notes ?? undefined,
            acknowledgedBy: user.id,
          },
        };
      },
      invalidatesTags: (_result, _err, { requestId, body }) => [
        { type: 'Inventory', id: requestId },
        { type: 'Inventory', id: `stock-request-allocation-${body.lineId}` },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    syncStockReservationsForRequest: builder.mutation<
      { requestId: string; created: number },
      { requestId: string }
    >({
      query: ({ requestId }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-requests/${requestId}/sync-reservations`,
          method: 'POST',
          body: { actorUserId: user.id },
        };
      },
      invalidatesTags: (_result, _err, { requestId }) => [
        { type: 'Inventory', id: requestId },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    listStockReservations: builder.query<
      ServerListResponse<StockReservation>,
      StockReservationListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-reservations',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockReservation: builder.query<StockReservation, string>({
      query: (id) => ({ url: `/inventory/stock-reservations/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    allocateStockReservation: builder.mutation<
      { id: string; allocatedQuantity: number; shortQuantity: number },
      { reservationId: string }
    >({
      query: ({ reservationId }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-reservations/${reservationId}/allocate`,
          method: 'POST',
          body: { actorUserId: user.id },
        };
      },
      invalidatesTags: (_result, _err, { reservationId }) => [
        { type: 'Inventory', id: reservationId },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    issueStockReservation: builder.mutation<
      { id: string; issuedQuantity: number; remainingQuantity: number },
      { reservationId: string; notes?: string }
    >({
      query: ({ reservationId, notes }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-reservations/${reservationId}/issue`,
          method: 'POST',
          body: { actorUserId: user.id, ...(notes ? { notes } : {}) },
        };
      },
      invalidatesTags: (_result, _err, { reservationId }) => [
        { type: 'Inventory', id: reservationId },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    getStockReservationExceptionsSummary: builder.query<
      StockReservationExceptionsSummary,
      { companyId: string }
    >({
      query: ({ companyId }) => ({
        url: '/inventory/stock-reservations/exceptions/summary',
        params: { companyId },
      }),
      providesTags: [{ type: 'Inventory', id: 'STOCK_RESERVATION_EXCEPTIONS' }],
    }),
    getStockAllocationPolicy: builder.query<
      StockAllocationPolicy,
      { companyId: string; requesterRootLocationId?: string | null }
    >({
      query: ({ companyId, requesterRootLocationId }) => ({
        url: '/inventory/allocation-policies',
        params: {
          companyId,
          requesterRootLocationId: requesterRootLocationId ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'STOCK_ALLOCATION_POLICY' }],
    }),
    upsertStockAllocationPolicy: builder.mutation<{ id: string }, StockAllocationPolicyUpsertInput>(
      {
        query: (body) => {
          const user = useAuthStore.getState().user;
          if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
          return {
            url: '/inventory/allocation-policies',
            method: 'POST',
            body: {
              companyId: user.company.id,
              createdBy: user.id,
              ...body,
            },
          };
        },
        invalidatesTags: [
          { type: 'Inventory', id: 'STOCK_ALLOCATION_POLICY' },
          { type: 'Inventory', id: 'STOCK_RESERVATION_EXCEPTIONS' },
          ...invalidateEntityListTag('Inventory'),
        ],
      },
    ),
    getInventoryDashboardSummary: builder.query<
      InventoryDashboardSummary,
      { companyId: string; locationId?: string | null; lowStockLimit?: number } | void
    >({
      query: (params) => ({
        url: '/inventory/dashboard/location-summary',
        params: {
          companyId: params?.companyId,
          locationId: params?.locationId ?? undefined,
          lowStockLimit: params?.lowStockLimit ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'DASHBOARD_SUMMARY' }],
    }),
    listReorderSuggestions: builder.query<
      ReorderSuggestionsResponse,
      { companyId: string; locationId?: string | null; includeZeroMin?: boolean } | void
    >({
      query: (params) => ({
        url: '/inventory/reorder-suggestions',
        params: {
          companyId: params?.companyId,
          locationId: params?.locationId ?? undefined,
          includeZeroMin: params?.includeZeroMin ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'REORDER_SUGGESTIONS' }],
    }),
    listInventoryReorderPolicies: builder.query<
      InventoryReorderPolicy[],
      {
        companyId: string;
        productId?: string | null;
        branchId?: string | null;
        locationType?: number | null;
        locationId?: string | null;
        active?: boolean | null;
      } | void
    >({
      query: (params) => ({
        url: '/inventory/reorder-policies',
        params: {
          companyId: params?.companyId,
          productId: params?.productId ?? undefined,
          branchId: params?.branchId ?? undefined,
          locationType: params?.locationType ?? undefined,
          locationId: params?.locationId ?? undefined,
          active: params?.active ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_REORDER_POLICIES' }],
    }),
    upsertInventoryReorderPolicy: builder.mutation<
      { id: string },
      InventoryReorderPolicyUpsertInput
    >({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/reorder-policies',
          method: 'POST',
          body: {
            companyId: user.company.id,
            createdBy: user.id,
            ...body,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_REORDER_POLICIES' },
        { type: 'Inventory', id: 'REORDER_SUGGESTIONS' },
        { type: 'Inventory', id: 'DASHBOARD_SUMMARY' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    listInventoryApprovalPolicies: builder.query<
      InventoryApprovalPolicy[],
      { companyId: string; entityType?: number; active?: boolean } | void
    >({
      query: (params) => ({
        url: '/inventory/approval-policies',
        params: {
          companyId: params?.companyId,
          entityType: params?.entityType ?? undefined,
          active: params?.active ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_APPROVAL_POLICIES' }],
    }),
    createInventoryApprovalPolicy: builder.mutation<
      { id: string },
      InventoryApprovalPolicyCreateInput
    >({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/approval-policies',
          method: 'POST',
          body: {
            companyId: user.company.id,
            createdBy: user.id,
            ...body,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_APPROVAL_POLICIES' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    submitInventoryApprovalRequest: builder.mutation<
      { id: string },
      InventoryApprovalRequestCreateInput
    >({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/approval-requests',
          method: 'POST',
          body: {
            companyId: user.company.id,
            submittedBy: user.id,
            ...body,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_APPROVAL_REQUESTS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    listInventoryApprovalRequests: builder.query<
      InventoryApprovalRequest[],
      { companyId: string; status?: number; entityType?: number } | void
    >({
      query: (params) => ({
        url: '/inventory/approval-requests',
        params: {
          companyId: params?.companyId,
          status: params?.status ?? undefined,
          entityType: params?.entityType ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_APPROVAL_REQUESTS' }],
    }),
    decideInventoryApprovalRequest: builder.mutation<
      { id: string },
      { id: string; body: InventoryApprovalDecisionInput }
    >({
      query: ({ id, body }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/approval-requests/${id}/decide`,
          method: 'POST',
          body: {
            status: body.status,
            reason: body.reason ?? undefined,
            decidedBy: user.id,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_APPROVAL_REQUESTS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    escalateOverdueInventoryApprovalRequests: builder.mutation<
      { escalatedCount: number },
      { companyId: string }
    >({
      query: ({ companyId }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/approval-requests/escalate-overdue',
          method: 'POST',
          body: {
            companyId,
            actorUserId: user.id,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_APPROVAL_REQUESTS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    getInventoryValuationSummary: builder.query<
      InventoryValuationSummary,
      { companyId: string; locationId?: string | null } | void
    >({
      query: (params) => ({
        url: '/inventory/valuation/summary',
        params: {
          companyId: params?.companyId,
          locationId: params?.locationId ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_VALUATION_SUMMARY' }],
    }),
    recomputeInventoryValuationSnapshots: builder.mutation<
      { snapshottedRows: number; method: number },
      { companyId: string; method?: number }
    >({
      query: ({ companyId, method }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/valuation/recompute',
          method: 'POST',
          body: {
            companyId,
            method: method ?? undefined,
            actorUserId: user.id,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_VALUATION_SUMMARY' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    syncInventoryFinancialPostings: builder.mutation<
      { posted: number },
      { companyId: string; dateFrom?: string; dateTo?: string }
    >({
      query: ({ companyId, dateFrom, dateTo }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/valuation/sync-financial-postings',
          method: 'POST',
          body: {
            companyId,
            actorUserId: user.id,
            dateFrom: dateFrom ?? undefined,
            dateTo: dateTo ?? undefined,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_VALUATION_SUMMARY' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    generateReplenishmentProposal: builder.mutation<
      { id: string; lines: number },
      ReplenishmentProposalCreateInput
    >({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/replenishment-proposals',
          method: 'POST',
          body: {
            companyId: user.company.id,
            generatedBy: user.id,
            ...body,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_REPLENISHMENT_PROPOSALS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    listReplenishmentProposals: builder.query<
      ReplenishmentProposal[],
      { companyId: string; status?: number } | void
    >({
      query: (params) => ({
        url: '/inventory/replenishment-proposals',
        params: {
          companyId: params?.companyId,
          status: params?.status ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_REPLENISHMENT_PROPOSALS' }],
    }),
    getReplenishmentProposal: builder.query<ReplenishmentProposalDetail, string>({
      query: (id) => ({ url: `/inventory/replenishment-proposals/${id}` }),
      providesTags: (_result, _err, id) => [
        { type: 'Inventory', id: `replenishment-proposal-${id}` },
      ],
    }),
    decideReplenishmentProposal: builder.mutation<{ id: string }, { id: string; status: number }>({
      query: ({ id, status }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/replenishment-proposals/${id}/decide`,
          method: 'POST',
          body: {
            status,
            actorUserId: user.id,
          },
        };
      },
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id: `replenishment-proposal-${id}` },
        { type: 'Inventory', id: 'INVENTORY_REPLENISHMENT_PROPOSALS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    listInventoryTasks: builder.query<
      InventoryTask[],
      { companyId: string; status?: number; taskType?: number } | void
    >({
      query: (params) => ({
        url: '/inventory/tasks',
        params: {
          companyId: params?.companyId,
          status: params?.status ?? undefined,
          taskType: params?.taskType ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_TASKS' }],
    }),
    getInventoryTask: builder.query<InventoryTaskDetail, string>({
      query: (id) => ({ url: `/inventory/tasks/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id: `inventory-task-${id}` }],
    }),
    createInventoryTask: builder.mutation<{ id: string }, InventoryTaskCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/tasks',
          method: 'POST',
          body: {
            companyId: user.company.id,
            createdBy: user.id,
            ...body,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_TASKS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    updateInventoryTaskStatus: builder.mutation<{ id: string }, { id: string; status: number }>({
      query: ({ id, status }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/tasks/${id}/status`,
          method: 'POST',
          body: {
            status,
            actorUserId: user.id,
          },
        };
      },
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id: `inventory-task-${id}` },
        { type: 'Inventory', id: 'INVENTORY_TASKS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    scanInventoryTask: builder.mutation<
      { id: string },
      { taskId: string; body: InventoryTaskScanInput }
    >({
      query: ({ taskId, body }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/tasks/${taskId}/scan`,
          method: 'POST',
          body: {
            scanCode: body.scanCode,
            quantity: body.quantity,
            scannedBy: user.id,
          },
        };
      },
      invalidatesTags: (_result, _err, { taskId }) => [
        { type: 'Inventory', id: `inventory-task-${taskId}` },
        { type: 'Inventory', id: 'INVENTORY_TASKS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    listInventoryEventJournal: builder.query<
      InventoryEventJournalRow[],
      { companyId: string; entityType?: string; entityId?: string; eventType?: number } | void
    >({
      query: (params) => ({
        url: '/inventory/audit/event-journal',
        params: {
          companyId: params?.companyId,
          entityType: params?.entityType ?? undefined,
          entityId: params?.entityId ?? undefined,
          eventType: params?.eventType ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_EVENT_JOURNAL' }],
    }),
    postInventoryCorrection: builder.mutation<{ id: string }, InventoryCorrectionInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/audit/corrections',
          method: 'POST',
          body: {
            companyId: user.company.id,
            actorUserId: user.id,
            ...body,
          },
        };
      },
      invalidatesTags: [
        { type: 'Inventory', id: 'INVENTORY_EVENT_JOURNAL' },
        { type: 'Inventory', id: 'INVENTORY_TASKS' },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    getInventoryEnterpriseKpis: builder.query<
      InventoryEnterpriseKpis,
      { companyId: string; locationId?: string | null; days?: number } | void
    >({
      query: (params) => ({
        url: '/inventory/reports/enterprise-kpis',
        params: {
          companyId: params?.companyId,
          locationId: params?.locationId ?? undefined,
          days: params?.days ?? undefined,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'INVENTORY_ENTERPRISE_KPIS' }],
    }),
    listStockMaintenanceRecords: builder.query<
      ServerListResponse<StockMaintenanceRecord>,
      StockMaintenanceListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-maintenance',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockMaintenanceRecord: builder.query<StockMaintenanceRecord, string>({
      query: (id) => ({ url: `/inventory/stock-maintenance/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    createStockMaintenanceRecord: builder.mutation<{ id: string }, StockMaintenanceCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-maintenance',
          method: 'POST',
          body: toCreateStockMaintenancePayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    resolveStockMaintenanceRecord: builder.mutation<
      { id: string },
      { id: string; body: StockMaintenanceResolveInput }
    >({
      query: ({ id, body }) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');
        return {
          url: `/inventory/stock-maintenance/${id}/resolve`,
          method: 'POST',
          body: toResolveStockMaintenancePayload(body, { resolvedBy: user.id }),
        };
      },
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useListStockLevelsQuery,
  useGetStockLevelQuery,
  useListStockLotsQuery,
  useGetStockLotQuery,
  useGetStockLotTraceabilityQuery,
  useGetStockLotAnalyticsQuery,
  useGetInventoryMonitoringSummaryQuery,
  useRunInventoryDailyAutomationMutation,
  useListStockCountSessionsQuery,
  useGetStockCountSessionQuery,
  useCreateStockCountSessionMutation,
  useUpdateStockCountSessionLineMutation,
  useSubmitStockCountSessionMutation,
  useApproveStockCountSessionMutation,
  useCreateStockLotMutation,
  useUpdateStockLotStatusMutation,
  useRunStockLotExpirySweepMutation,
  useGetStockLotExpiryAlertsQuery,
  useListStockMovementsQuery,
  useCreateStockMovementMutation,
  useListStockAdjustmentsQuery,
  useCreateStockAdjustmentMutation,
  useListStockTransfersQuery,
  useGetStockTransferQuery,
  useCreateStockTransferMutation,
  useUpdateStockTransferMutation,
  useAcknowledgeStockTransferReceiptMutation,
  useListStockRequestsQuery,
  useGetStockRequestQuery,
  useCreateStockRequestMutation,
  useSubmitStockRequestMutation,
  useApproveStockRequestMutation,
  useRejectStockRequestMutation,
  useFulfillStockRequestLineMutation,
  useGetStockRequestLineAllocationQuery,
  useAutoFulfillStockRequestLineMutation,
  useAcknowledgeStockRequestLineMutation,
  useSyncStockReservationsForRequestMutation,
  useListStockReservationsQuery,
  useGetStockReservationQuery,
  useAllocateStockReservationMutation,
  useIssueStockReservationMutation,
  useGetStockReservationExceptionsSummaryQuery,
  useGetStockAllocationPolicyQuery,
  useUpsertStockAllocationPolicyMutation,
  useGetInventoryDashboardSummaryQuery,
  useListReorderSuggestionsQuery,
  useListInventoryReorderPoliciesQuery,
  useUpsertInventoryReorderPolicyMutation,
  useListInventoryApprovalPoliciesQuery,
  useCreateInventoryApprovalPolicyMutation,
  useSubmitInventoryApprovalRequestMutation,
  useListInventoryApprovalRequestsQuery,
  useDecideInventoryApprovalRequestMutation,
  useEscalateOverdueInventoryApprovalRequestsMutation,
  useGetInventoryValuationSummaryQuery,
  useRecomputeInventoryValuationSnapshotsMutation,
  useSyncInventoryFinancialPostingsMutation,
  useGenerateReplenishmentProposalMutation,
  useListReplenishmentProposalsQuery,
  useGetReplenishmentProposalQuery,
  useDecideReplenishmentProposalMutation,
  useListInventoryTasksQuery,
  useGetInventoryTaskQuery,
  useCreateInventoryTaskMutation,
  useUpdateInventoryTaskStatusMutation,
  useScanInventoryTaskMutation,
  useListInventoryEventJournalQuery,
  usePostInventoryCorrectionMutation,
  useGetInventoryEnterpriseKpisQuery,
  useListStockMaintenanceRecordsQuery,
  useGetStockMaintenanceRecordQuery,
  useCreateStockMaintenanceRecordMutation,
  useResolveStockMaintenanceRecordMutation,
} = inventoryApi;
