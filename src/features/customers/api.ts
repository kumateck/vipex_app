import { api } from '@/services/api';

export interface Customer {
  id: string;
  companyId: string;
  fullname: string;
  telephone?: string;
  email?: string;
  createdAt: string;
}

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCustomers: builder.query<{ data: Customer[] }, { companyId?: string; search?: string }>({
      query: (params) => ({ url: '/customers', params }),
      providesTags: ['Customers'],
    }),
  }),
});

export const { useListCustomersQuery } = customersApi;
