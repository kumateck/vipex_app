import { api } from '@/services/api';
import type { CustomerMessage, InboxQuery, MessageDetail, MessageStatus } from '../types';

const customerMessagesApi = api
  .enhanceEndpoints({ addTagTypes: ['CustomerMessages'] })
  .injectEndpoints({
    endpoints: (builder) => ({
      listCustomerMessages: builder.query<
        { items: CustomerMessage[]; total: number; page: number; pageSize: number },
        InboxQuery
      >({
        query: (params) => ({ url: '/customer-messages', params }),
        providesTags: ['CustomerMessages'],
      }),
      getCustomerMessage: builder.query<MessageDetail, string>({
        query: (id) => `/customer-messages/${encodeURIComponent(id)}`,
        providesTags: ['CustomerMessages'],
      }),
      updateCustomerMessage: builder.mutation<
        CustomerMessage,
        { id: string; status: MessageStatus; note?: string; updatedAt: string }
      >({
        query: ({ id, ...body }) => ({
          url: `/customer-messages/${encodeURIComponent(id)}`,
          method: 'PATCH',
          body,
        }),
        invalidatesTags: ['CustomerMessages'],
      }),
    }),
  });
export const {
  useListCustomerMessagesQuery,
  useGetCustomerMessageQuery,
  useUpdateCustomerMessageMutation,
} = customerMessagesApi;
