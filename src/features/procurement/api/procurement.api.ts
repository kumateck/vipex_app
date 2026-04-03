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
  useCreateProcurementSupplierMutation,
  useUpdateProcurementSupplierMutation,
  useListPurchaseRequestsQuery,
  useCreatePurchaseRequestMutation,
  useApprovePurchaseRequestMutation,
  useRejectPurchaseRequestMutation,
} = procurementApi;
