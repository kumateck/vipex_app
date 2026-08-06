import { api } from '@/services/api';
import type { ServerListResponse } from '@/services/rtk-query';
import type {
  CompanySmsSettings,
  CompanySmsTemplate,
  CreateBulkSmsInput,
  SmsTemplateFormValues,
} from '../types';

export const smsSettingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCompanySmsSettings: builder.query<CompanySmsSettings, void>({
      query: () => ({ url: '/notification-hub/sms-settings' }),
      providesTags: [{ type: 'NotificationHub', id: 'SMS_SETTINGS' }],
    }),
    setCompanyDefaultSmsProvider: builder.mutation<
      { providerKey: string },
      { providerKey: string }
    >({
      query: (body) => ({
        url: '/notification-hub/sms-settings/default-provider',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'NotificationHub', id: 'SMS_SETTINGS' },
        { type: 'NotificationHub', id: 'LIST' },
      ],
    }),
    updateCompanySmsEvent: builder.mutation<
      { id: string; eventCode: string },
      { eventCode: string; body: string }
    >({
      query: ({ eventCode, body }) => ({
        url: `/notification-hub/sms-settings/events/${eventCode}`,
        method: 'PUT',
        body: { body },
      }),
      invalidatesTags: [
        { type: 'NotificationHub', id: 'SMS_SETTINGS' },
        { type: 'NotificationHub', id: 'LIST' },
      ],
    }),
    listCompanySmsTemplates: builder.query<ServerListResponse<CompanySmsTemplate>, void>({
      query: () => ({
        url: '/notification-hub/sms-settings/templates',
        params: { page: 1, pageSize: 100 },
      }),
      providesTags: [{ type: 'NotificationHub', id: 'SMS_TEMPLATES' }],
    }),
    createCompanySmsTemplate: builder.mutation<{ id: string }, SmsTemplateFormValues>({
      query: (body) => ({
        url: '/notification-hub/sms-settings/templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'NotificationHub', id: 'SMS_TEMPLATES' },
        { type: 'NotificationHub', id: 'TEMPLATE_OPTIONS' },
      ],
    }),
    updateCompanySmsTemplate: builder.mutation<
      { id: string },
      { id: string; body: Omit<SmsTemplateFormValues, 'code'> }
    >({
      query: ({ id, body }) => ({
        url: `/notification-hub/sms-settings/templates/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        { type: 'NotificationHub', id: 'SMS_TEMPLATES' },
        { type: 'NotificationHub', id: 'TEMPLATE_OPTIONS' },
      ],
    }),
    createBulkSmsCampaign: builder.mutation<{ id: string; submitted: boolean }, CreateBulkSmsInput>(
      {
        query: (body) => ({
          url: '/notification-hub/sms-settings/bulk-campaigns',
          method: 'POST',
          body,
        }),
        invalidatesTags: [{ type: 'NotificationHub', id: 'LIST' }],
      },
    ),
  }),
});

export const {
  useGetCompanySmsSettingsQuery,
  useSetCompanyDefaultSmsProviderMutation,
  useUpdateCompanySmsEventMutation,
  useListCompanySmsTemplatesQuery,
  useCreateCompanySmsTemplateMutation,
  useUpdateCompanySmsTemplateMutation,
  useCreateBulkSmsCampaignMutation,
} = smsSettingsApi;
