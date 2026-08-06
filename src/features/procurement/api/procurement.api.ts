import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export type ProcurementSupplier = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  telephone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementSupplierOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type PurchaseRequest = {
  id: string;
  requestNo: string;
  title: string;
  description: string | null;
  amountPsw: number;
  status: number;
  supplierId: string | null;
  supplierName: string | null;
  requestedByUserId: string;
  requestedByName: string | null;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementDemand = {
  id: string;
  demandNo: string;
  sourceModule: string;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  dedupeKey: string | null;
  branchId: string | null;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  estimatedUnitCostPsw: number;
  estimatedTotalPsw: number;
  urgency: number;
  neededBy: string | null;
  status: number;
  note: string | null;
  metadataJson: string | null;
  requestedByUserId: string;
  requestedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementFleetPolicy = {
  id: string;
  companyId: string;
  branchId: string | null;
  preferredSupplierId: string | null;
  preferredSupplierName: string | null;
  demandUrgency: number;
  replenishMultiplier: number;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementDemandConsolidation = {
  id: string;
  companyId: string;
  consolidationNo: string;
  sourceRootLocationId: string | null;
  targetMainStoreLocationId: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementSupplierQuote = {
  id: string;
  companyId: string;
  demandId: string;
  supplierId: string;
  quoteNo: string;
  quantity: number;
  unitCostPsw: number;
  totalCostPsw: number;
  status: number;
  note: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementPurchaseOrder = {
  id: string;
  companyId: string;
  purchaseRequestId: string | null;
  supplierId: string;
  poNo: string;
  status: number;
  note: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementGoodsReceipt = {
  id: string;
  companyId: string;
  purchaseOrderId: string;
  receiptNo: string;
  note: string | null;
  receivedBy: string;
  createdAt: string;
  updatedAt: string;
};

export const procurementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listProcurementSuppliers: builder.query<
      ServerListResponse<ProcurementSupplier>,
      ServerListQuery<{ isActive?: boolean }> | void
    >({
      query: (query) => ({
        url: '/procurement/suppliers',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Procurement', result),
    }),

    listProcurementSupplierOptions: builder.query<
      ProcurementSupplierOption[],
      { search?: string; isActive?: boolean } | void
    >({
      query: (params) => ({
        url: '/procurement/suppliers/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Procurement', id: 'SUPPLIER_OPTIONS' }],
    }),

    getProcurementSupplierById: builder.query<ProcurementSupplier, string>({
      query: (id) => ({
        url: `/procurement/suppliers/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Procurement', id }],
    }),

    createProcurementSupplier: builder.mutation<
      { id: string },
      {
        name: string;
        contactPerson?: string | null;
        email?: string | null;
        telephone?: string | null;
        address?: string | null;
      }
    >({
      query: (body) => ({
        url: '/procurement/suppliers',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    updateProcurementSupplier: builder.mutation<
      { id: string },
      {
        id: string;
        body: {
          name?: string;
          contactPerson?: string | null;
          email?: string | null;
          telephone?: string | null;
          address?: string | null;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/procurement/suppliers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Procurement', id },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),

    listProcurementDemands: builder.query<
      ServerListResponse<ProcurementDemand>,
      ServerListQuery<{ status?: number; sourceModule?: string; branchId?: string }> | void
    >({
      query: (query) => ({
        url: '/procurement/demands',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Procurement', result),
    }),

    listProcurementFleetPolicies: builder.query<
      ProcurementFleetPolicy[],
      { isActive?: boolean; branchId?: string } | void
    >({
      query: (params) => ({
        url: '/procurement/fleet-policies',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Procurement', id: 'FLEET_POLICY_RULES' }],
    }),

    getProcurementFleetPolicyById: builder.query<ProcurementFleetPolicy, string>({
      query: (id) => ({
        url: `/procurement/fleet-policies/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Procurement', id }],
    }),

    createProcurementFleetPolicy: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        preferredSupplierId?: string | null;
        demandUrgency?: number;
        replenishMultiplier?: number;
        isActive?: boolean;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/procurement/fleet-policies',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Procurement', id: 'FLEET_POLICY_RULES' },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),

    updateProcurementFleetPolicy: builder.mutation<
      { id: string },
      {
        id: string;
        body: {
          preferredSupplierId?: string | null;
          demandUrgency?: number;
          replenishMultiplier?: number;
          isActive?: boolean;
          note?: string | null;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/procurement/fleet-policies/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Procurement', id: 'FLEET_POLICY_RULES' },
        { type: 'Procurement', id },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),

    createProcurementDemand: builder.mutation<
      { id: string; demandNo: string },
      {
        branchId?: string | null;
        sourceModule: string;
        sourceEntityType?: string | null;
        sourceEntityId?: string | null;
        dedupeKey?: string | null;
        itemCode: string;
        itemName: string;
        unit?: string | null;
        quantity: number;
        estimatedUnitCostPsw?: number;
        urgency?: number;
        neededBy?: string | null;
        note?: string | null;
        metadataJson?: string | null;
      }
    >({
      query: (body) => ({
        url: '/procurement/demands',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    createProcurementDemandsFromFleetLowStock: builder.mutation<
      { candidates: number; created: number; deduped: number; demandNos: string[] },
      {
        branchId?: string | null;
        limit?: number;
        replenishMultiplier?: number;
        usePolicyRules?: boolean;
      } | void
    >({
      query: (body) => ({
        url: '/procurement/demands/from-fleet-low-stock',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    createProcurementDemandsFromInventoryLowStock: builder.mutation<
      { scanned: number; created: number; deduped: number; demandNos: string[] },
      {
        rootLocationId?: string | null;
        targetMainStoreLocationId?: string | null;
        lowStockLimit?: number;
      } | void
    >({
      query: (body) => ({
        url: '/procurement/demands/from-inventory-low-stock',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    convertProcurementDemandsToPurchaseRequests: builder.mutation<
      { converted: number; requestIds: string[] },
      { demandIds: string[]; supplierId?: string | null }
    >({
      query: (body) => ({
        url: '/procurement/demands/convert-to-purchase-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    listProcurementDemandConsolidations: builder.query<
      ServerListResponse<ProcurementDemandConsolidation>,
      ServerListQuery | void
    >({
      query: (query) => ({
        url: '/procurement/demands/consolidations',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Procurement', result),
    }),

    consolidateProcurementDemands: builder.mutation<
      { id: string; consolidationNo: string; consolidated: number },
      {
        demandIds: string[];
        sourceRootLocationId?: string | null;
        targetMainStoreLocationId?: string | null;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/procurement/demands/consolidations',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    approveProcurementDemand: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/procurement/demands/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Procurement', id },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),

    rejectProcurementDemand: builder.mutation<
      { id: string },
      { id: string; rejectionReason: string }
    >({
      query: ({ id, rejectionReason }) => ({
        url: `/procurement/demands/${id}/reject`,
        method: 'POST',
        body: { rejectionReason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Procurement', id },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),

    listProcurementSupplierQuotes: builder.query<
      ServerListResponse<ProcurementSupplierQuote>,
      ServerListQuery<{ demandId?: string; supplierId?: string; status?: number }> | void
    >({
      query: (query) => ({
        url: '/procurement/supplier-quotes',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Procurement', result),
    }),

    createProcurementSupplierQuote: builder.mutation<
      { id: string; quoteNo: string },
      {
        demandId: string;
        supplierId: string;
        quantity: number;
        unitCostPsw: number;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/procurement/supplier-quotes',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    acceptProcurementSupplierQuote: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/procurement/supplier-quotes/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Procurement', id },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),

    listProcurementPurchaseOrders: builder.query<
      ServerListResponse<ProcurementPurchaseOrder>,
      ServerListQuery<{ supplierId?: string; status?: number }> | void
    >({
      query: (query) => ({
        url: '/procurement/purchase-orders',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Procurement', result),
    }),

    createProcurementPurchaseOrderFromAcceptedQuotes: builder.mutation<
      { id: string; poNo: string },
      { quoteIds: string[]; note?: string | null }
    >({
      query: (body) => ({
        url: '/procurement/purchase-orders/from-accepted-quotes',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    listProcurementGoodsReceipts: builder.query<
      ServerListResponse<ProcurementGoodsReceipt>,
      ServerListQuery<{ purchaseOrderId?: string }> | void
    >({
      query: (query) => ({
        url: '/procurement/goods-receipts',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Procurement', result),
    }),

    createProcurementGoodsReceipt: builder.mutation<
      { id: string; receiptNo: string },
      {
        purchaseOrderId: string;
        note?: string | null;
        lines: {
          purchaseOrderItemId: string;
          receivedQuantity: number;
          locationId?: string | null;
          batchNumber?: string | null;
          supplierBatchNumber?: string | null;
          manufacturedAt?: string | null;
          expiryDate?: string | null;
        }[];
      }
    >({
      query: (body) => ({
        url: '/procurement/goods-receipts',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    listPurchaseRequests: builder.query<
      ServerListResponse<PurchaseRequest>,
      ServerListQuery<{ status?: number; supplierId?: string; pendingOnly?: boolean }> | void
    >({
      query: (query) => ({
        url: '/procurement/purchase-requests',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Procurement', result),
    }),

    createPurchaseRequest: builder.mutation<
      { id: string },
      {
        supplierId?: string | null;
        title: string;
        description?: string | null;
        amountPsw: number;
      }
    >({
      query: (body) => ({
        url: '/procurement/purchase-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Procurement'),
    }),

    approvePurchaseRequest: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/procurement/purchase-requests/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Procurement', id },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),

    rejectPurchaseRequest: builder.mutation<
      { id: string },
      { id: string; rejectionReason: string }
    >({
      query: ({ id, rejectionReason }) => ({
        url: `/procurement/purchase-requests/${id}/reject`,
        method: 'POST',
        body: { rejectionReason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Procurement', id },
        ...invalidateEntityListTag('Procurement'),
      ],
    }),
  }),
});

export const {
  useListProcurementSuppliersQuery,
  useListProcurementSupplierOptionsQuery,
  useGetProcurementSupplierByIdQuery,
  useCreateProcurementSupplierMutation,
  useUpdateProcurementSupplierMutation,
  useListProcurementDemandsQuery,
  useListProcurementFleetPoliciesQuery,
  useGetProcurementFleetPolicyByIdQuery,
  useCreateProcurementFleetPolicyMutation,
  useUpdateProcurementFleetPolicyMutation,
  useCreateProcurementDemandMutation,
  useCreateProcurementDemandsFromFleetLowStockMutation,
  useCreateProcurementDemandsFromInventoryLowStockMutation,
  useConvertProcurementDemandsToPurchaseRequestsMutation,
  useListProcurementDemandConsolidationsQuery,
  useConsolidateProcurementDemandsMutation,
  useApproveProcurementDemandMutation,
  useRejectProcurementDemandMutation,
  useListProcurementSupplierQuotesQuery,
  useCreateProcurementSupplierQuoteMutation,
  useAcceptProcurementSupplierQuoteMutation,
  useListProcurementPurchaseOrdersQuery,
  useCreateProcurementPurchaseOrderFromAcceptedQuotesMutation,
  useListProcurementGoodsReceiptsQuery,
  useCreateProcurementGoodsReceiptMutation,
  useListPurchaseRequestsQuery,
  useCreatePurchaseRequestMutation,
  useApprovePurchaseRequestMutation,
  useRejectPurchaseRequestMutation,
} = procurementApi;
