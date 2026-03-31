import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export type NotificationProvider = {
  id: string;
  channel: string;
  providerKey: string;
  name: string;
  configJson: unknown;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationTemplate = {
  id: string;
  channel: string;
  code: string;
  name: string;
  subject: string | null;
  body: string;
  variablesJson: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationCampaign = {
  id: string;
  name: string;
  eventCode: string | null;
  channel: string;
  templateId: string | null;
  templateName: string | null;
  subjectOverride: string | null;
  bodyOverride: string | null;
  audienceType: string;
  status: number;
  scheduledAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  approvalNote: string | null;
  sentBy: string | null;
  sentAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationDispatch = {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  channel: string;
  providerId: string | null;
  providerKey: string | null;
  recipientType: string;
  recipientId: string | null;
  recipientName: string | null;
  recipientAddress: string;
  subject: string | null;
  body: string;
  status: string;
  attemptCount: number;
  providerMessageId: string | null;
  errorMessage: string | null;
  metadataJson: unknown;
  createdAt: string;
  updatedAt: string;
};

export type NotificationTemplateOption = {
  id: string;
  code: string;
  name: string;
  channel: string;
};

export const notificationHubApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNotificationProviders: builder.query<
      ServerListResponse<NotificationProvider>,
      ServerListQuery<{ channel?: string; isActive?: boolean }> | void
    >({
      query: (query) => ({
        url: '/notification-hub/providers',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('NotificationHub', result),
    }),
    createNotificationProvider: builder.mutation<
      { id: string },
      {
        channel: string;
        providerKey: string;
        name: string;
        configJson?: unknown;
        isActive?: boolean;
        isDefault?: boolean;
      }
    >({
      query: (body) => ({
        url: '/notification-hub/providers',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('NotificationHub'),
    }),
    updateNotificationProvider: builder.mutation<
      { id: string },
      {
        id: string;
        body: {
          name?: string;
          configJson?: unknown;
          isActive?: boolean;
          isDefault?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/notification-hub/providers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
    setDefaultNotificationProvider: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/notification-hub/providers/${id}/default`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
    listNotificationTemplates: builder.query<
      ServerListResponse<NotificationTemplate>,
      ServerListQuery<{ channel?: string; isActive?: boolean }> | void
    >({
      query: (query) => ({
        url: '/notification-hub/templates',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('NotificationHub', result),
    }),
    listNotificationTemplateOptions: builder.query<
      NotificationTemplateOption[],
      { channel?: string } | void
    >({
      query: (query) => ({
        url: '/notification-hub/templates/options',
        params: query ?? undefined,
      }),
      providesTags: [{ type: 'NotificationHub', id: 'TEMPLATE_OPTIONS' }],
    }),
    createNotificationTemplate: builder.mutation<
      { id: string },
      {
        channel: string;
        code: string;
        name: string;
        subject?: string | null;
        body: string;
        variablesJson?: unknown;
        isActive?: boolean;
      }
    >({
      query: (body) => ({
        url: '/notification-hub/templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('NotificationHub'),
    }),
    updateNotificationTemplate: builder.mutation<
      { id: string },
      {
        id: string;
        body: {
          name?: string;
          subject?: string | null;
          body?: string;
          variablesJson?: unknown;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/notification-hub/templates/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
    listNotificationCampaigns: builder.query<
      ServerListResponse<NotificationCampaign>,
      ServerListQuery<{ channel?: string; status?: number; pendingOnly?: boolean }> | void
    >({
      query: (query) => ({
        url: '/notification-hub/campaigns',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('NotificationHub', result),
    }),
    createNotificationCampaign: builder.mutation<
      { id: string },
      {
        name: string;
        eventCode?: string | null;
        channel: string;
        templateId?: string | null;
        subjectOverride?: string | null;
        bodyOverride?: string | null;
        audienceType: string;
        scheduledAt?: string | null;
      }
    >({
      query: (body) => ({
        url: '/notification-hub/campaigns',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('NotificationHub'),
    }),
    submitNotificationCampaign: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/notification-hub/campaigns/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
    approveNotificationCampaign: builder.mutation<
      { id: string },
      { id: string; note?: string | null }
    >({
      query: ({ id, note }) => ({
        url: `/notification-hub/campaigns/${id}/approve`,
        method: 'POST',
        body: { note: note ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
    rejectNotificationCampaign: builder.mutation<{ id: string }, { id: string; note: string }>({
      query: ({ id, note }) => ({
        url: `/notification-hub/campaigns/${id}/reject`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
    sendNotificationCampaign: builder.mutation<
      { id: string; sentCount: number; failedCount: number },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/notification-hub/campaigns/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
    listNotificationDispatches: builder.query<
      ServerListResponse<NotificationDispatch>,
      ServerListQuery<{ channel?: string; status?: string; campaignId?: string }> | void
    >({
      query: (query) => ({
        url: '/notification-hub/dispatches',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('NotificationHub', result),
    }),
    retryNotificationDispatch: builder.mutation<{ id: string; status: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/notification-hub/dispatches/${id}/retry`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHub', id },
        ...invalidateEntityListTag('NotificationHub'),
      ],
    }),
  }),
});

export const {
  useListNotificationProvidersQuery,
  useCreateNotificationProviderMutation,
  useUpdateNotificationProviderMutation,
  useSetDefaultNotificationProviderMutation,
  useListNotificationTemplatesQuery,
  useListNotificationTemplateOptionsQuery,
  useCreateNotificationTemplateMutation,
  useUpdateNotificationTemplateMutation,
  useListNotificationCampaignsQuery,
  useCreateNotificationCampaignMutation,
  useSubmitNotificationCampaignMutation,
  useApproveNotificationCampaignMutation,
  useRejectNotificationCampaignMutation,
  useSendNotificationCampaignMutation,
  useListNotificationDispatchesQuery,
  useRetryNotificationDispatchMutation,
} = notificationHubApi;
