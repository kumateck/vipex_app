import { api } from '@/services/api';
import type { WhatsAppBillingRatesInput, WhatsAppSpendReport } from '../types';

const SPEND_TAG = { type: 'NotificationHub' as const, id: 'WHATSAPP_SPEND' };

export const whatsappSpendApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWhatsAppSpend: builder.query<WhatsAppSpendReport, { from: string; to: string }>({
      query: (params) => ({ url: '/whatsapp/spend', params }),
      providesTags: [SPEND_TAG],
    }),
    saveWhatsAppBillingRates: builder.mutation<{ currency: string }, WhatsAppBillingRatesInput>({
      query: (body) => ({ url: '/whatsapp/spend/rates', method: 'PUT', body }),
      invalidatesTags: [SPEND_TAG],
    }),
    deleteWhatsAppBillingRate: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/whatsapp/spend/rates/${id}`, method: 'DELETE' }),
      invalidatesTags: [SPEND_TAG],
    }),
  }),
});

export const {
  useGetWhatsAppSpendQuery,
  useSaveWhatsAppBillingRatesMutation,
  useDeleteWhatsAppBillingRateMutation,
} = whatsappSpendApi;
