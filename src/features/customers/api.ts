import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

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

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCustomers: builder.query<ServerListResponse<Customer>, ServerListQuery<CustomerFilters> | void>({
      query: (query) => ({
        url: '/customers',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Customers', result),
    }),
  }),
});

export const { useListCustomersQuery } = customersApi;
