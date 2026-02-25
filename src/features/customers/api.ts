import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';

export interface Customer {
  id: string;
  companyId: string;
  fullname: string;
  telephone?: string;
  email?: string;
  createdAt: string;
}

export interface CustomerFilters {
  companyId?: string;
  includeDeleted?: boolean | null;
}

export interface CreateCustomerInput {
  fullname: string;
  telephone?: string | null;
  telephone2?: string | null;
  address?: string | null;
  email?: string | null;
}

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCustomers: builder.query<ServerListResponse<Customer>, ServerListQuery<CustomerFilters> | void>({
      query: (query) => ({
        url: '/customers',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Customers', result),
    }),
    findCustomersByTelephone: builder.query<Customer[], { telephone: string; limit?: number }>({
      query: ({ telephone, limit = 10 }) => ({
        url: `/customers/lookup/by-telephone/${encodeURIComponent(telephone)}`,
        params: { limit },
      }),
      providesTags: [{ type: 'Customers', id: 'PHONE_LOOKUP' }],
    }),
    createCustomer: builder.mutation<{ id: string }, CreateCustomerInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');

        return {
          url: '/customers',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: invalidateEntityListTag('Customers'),
    }),
  }),
});

export const { useListCustomersQuery, useFindCustomersByTelephoneQuery, useCreateCustomerMutation } = customersApi;
