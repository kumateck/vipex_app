import { api } from '@/services/api';
import type { WhatsAppAvailability, WhatsAppProviderFormValues, WhatsAppSettings } from '../types';

const SETTINGS_TAG = { type: 'NotificationHub' as const, id: 'WHATSAPP_SETTINGS' };
const AVAILABILITY_TAG = { type: 'NotificationHub' as const, id: 'WHATSAPP_AVAILABILITY' };

export const whatsappSettingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWhatsAppAvailability: builder.query<WhatsAppAvailability, void>({
      query: () => ({ url: '/whatsapp/availability' }),
      providesTags: [AVAILABILITY_TAG],
    }),
    getWhatsAppSettings: builder.query<WhatsAppSettings, void>({
      query: () => ({ url: '/whatsapp/settings' }),
      providesTags: [SETTINGS_TAG],
    }),
    saveWhatsAppProvider: builder.mutation<{ id: string }, WhatsAppProviderFormValues>({
      query: (body) => ({ url: '/whatsapp/settings/provider', method: 'PUT', body }),
      invalidatesTags: [SETTINGS_TAG, AVAILABILITY_TAG],
    }),
    updateWhatsAppEventTemplate: builder.mutation<
      { id: string; eventCode: string },
      { eventCode: string; templateName: string; language: string }
    >({
      query: ({ eventCode, ...body }) => ({
        url: `/whatsapp/settings/events/${eventCode}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [SETTINGS_TAG],
    }),
    sendWhatsAppTest: builder.mutation<{ providerMessageId: string | null }, { phone: string }>({
      query: (body) => ({ url: '/whatsapp/settings/test', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetWhatsAppAvailabilityQuery,
  useGetWhatsAppSettingsQuery,
  useSaveWhatsAppProviderMutation,
  useUpdateWhatsAppEventTemplateMutation,
  useSendWhatsAppTestMutation,
} = whatsappSettingsApi;
