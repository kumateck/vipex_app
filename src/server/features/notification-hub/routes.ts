import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { NonEmpty255, PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireAnyPermissions,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  approveNotificationCampaignCtrl,
  createNotificationCampaignCtrl,
  createNotificationProviderCtrl,
  createNotificationTemplateCtrl,
  getNotificationProviderCtrl,
  getNotificationTemplateCtrl,
  listCampaignDispatchSummaryCtrl,
  listNotificationCampaignsCtrl,
  listNotificationDispatchesCtrl,
  listNotificationProvidersCtrl,
  listNotificationTemplateOptionsCtrl,
  listNotificationTemplatesCtrl,
  rejectNotificationCampaignCtrl,
  retryNotificationDispatchCtrl,
  sendNotificationCampaignCtrl,
  sendParcelStatusNotificationCtrl,
  setDefaultNotificationProviderCtrl,
  submitNotificationCampaignCtrl,
  updateNotificationProviderCtrl,
  updateNotificationTemplateCtrl,
} from './controller';

export const notificationHubRoutes = new Elysia({ name: 'notification-hub' })
  .use(authPlugin)
  .get(
    '/providers',
    async ({ query, user }) =>
      listNotificationProvidersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          channel: query.channel,
          isActive: query.isActive ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        channel: t.Optional(t.String({ maxLength: 16 })),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'List notification providers' },
    },
  )
  .post(
    '/providers',
    async ({ body, set, user }) => {
      const result = await createNotificationProviderCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        channel: body.channel,
        providerKey: body.providerKey,
        name: body.name,
        configJson: body.configJson ?? null,
        isActive: body.isActive ?? true,
        isDefault: body.isDefault ?? false,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        channel: t.String({ minLength: 2, maxLength: 16 }),
        providerKey: t.String({ minLength: 2, maxLength: 64 }),
        name: NonEmpty255,
        configJson: t.Optional(t.Any()),
        isActive: t.Optional(t.Boolean()),
        isDefault: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageNotificationProviders),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Create notification provider' },
    },
  )
  .get(
    '/providers/:id',
    async ({ params, user }) =>
      getNotificationProviderCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Get notification provider' },
    },
  )
  .patch(
    '/providers/:id',
    async ({ params, body, user }) =>
      updateNotificationProviderCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          name: body.name,
          configJson: body.configJson,
          isActive: body.isActive,
          isDefault: body.isDefault,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(NonEmpty255),
        configJson: t.Optional(t.Any()),
        isActive: t.Optional(t.Boolean()),
        isDefault: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageNotificationProviders),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Update notification provider' },
    },
  )
  .post(
    '/providers/:id/default',
    async ({ params, user }) =>
      setDefaultNotificationProviderCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageNotificationProviders),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Set provider as default for its channel' },
    },
  )
  .get(
    '/templates',
    async ({ query, user }) =>
      listNotificationTemplatesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          channel: query.channel,
          isActive: query.isActive ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        channel: t.Optional(t.String({ maxLength: 16 })),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'List notification templates' },
    },
  )
  .get(
    '/templates/options',
    async ({ query, user }) =>
      listNotificationTemplateOptionsCtrl({
        companyId: (user as AuthUser).companyId!,
        channel: query.channel,
      }),
    {
      query: t.Object({ channel: t.Optional(t.String({ maxLength: 16 })) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'List active template options' },
    },
  )
  .post(
    '/templates',
    async ({ body, set, user }) => {
      const result = await createNotificationTemplateCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        channel: body.channel,
        code: body.code,
        name: body.name,
        subject: body.subject ?? null,
        body: body.body,
        variablesJson: body.variablesJson ?? null,
        isActive: body.isActive ?? true,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        channel: t.String({ minLength: 2, maxLength: 16 }),
        code: t.String({ minLength: 2, maxLength: 64 }),
        name: NonEmpty255,
        subject: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        body: t.String({ minLength: 1 }),
        variablesJson: t.Optional(t.Any()),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageNotificationTemplates),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Create notification template' },
    },
  )
  .get(
    '/templates/:id',
    async ({ params, user }) =>
      getNotificationTemplateCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Get notification template' },
    },
  )
  .patch(
    '/templates/:id',
    async ({ params, body, user }) =>
      updateNotificationTemplateCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          name: body.name,
          subject: body.subject,
          body: body.body,
          variablesJson: body.variablesJson,
          isActive: body.isActive,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(NonEmpty255),
        subject: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        body: t.Optional(t.String({ minLength: 1 })),
        variablesJson: t.Optional(t.Any()),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageNotificationTemplates),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Update notification template' },
    },
  )
  .get(
    '/campaigns',
    async ({ query, user }) =>
      listNotificationCampaignsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          channel: query.channel,
          status: query.status,
          pendingOnly: query.pendingOnly ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        channel: t.Optional(t.String({ maxLength: 16 })),
        status: t.Optional(t.Number()),
        pendingOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'List notification campaigns' },
    },
  )
  .post(
    '/campaigns',
    async ({ body, set, user }) => {
      const result = await createNotificationCampaignCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        name: body.name,
        eventCode: body.eventCode ?? null,
        channel: body.channel,
        templateId: body.templateId ?? null,
        subjectOverride: body.subjectOverride ?? null,
        bodyOverride: body.bodyOverride ?? null,
        audienceType: body.audienceType,
        scheduledAt: body.scheduledAt ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        name: NonEmpty255,
        eventCode: t.Optional(t.Union([t.String({ maxLength: 80 }), t.Null()])),
        channel: t.String({ minLength: 2, maxLength: 16 }),
        templateId: t.Optional(t.Union([UUID, t.Null()])),
        subjectOverride: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        bodyOverride: t.Optional(t.Union([t.String(), t.Null()])),
        audienceType: t.String({ minLength: 2, maxLength: 64 }),
        scheduledAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateNotificationCampaigns),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Create notification campaign' },
    },
  )
  .post(
    '/campaigns/:id/submit',
    async ({ params, user }) =>
      submitNotificationCampaignCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateNotificationCampaigns),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Submit campaign for approval' },
    },
  )
  .post(
    '/campaigns/:id/approve',
    async ({ params, body, user }) =>
      approveNotificationCampaignCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        note: body.note ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ note: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveNotificationCampaigns),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Approve campaign' },
    },
  )
  .post(
    '/campaigns/:id/reject',
    async ({ params, body, user }) =>
      rejectNotificationCampaignCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        note: body.note,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ note: NonEmpty255 }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveNotificationCampaigns),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Reject campaign' },
    },
  )
  .post(
    '/campaigns/:id/send',
    async ({ params, user }) =>
      sendNotificationCampaignCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanSendNotificationCampaigns),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Send approved campaign' },
    },
  )
  .get(
    '/campaigns/:id/dispatch-summary',
    async ({ params, user }) =>
      listCampaignDispatchSummaryCtrl({
        campaignId: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Dispatch summary for a campaign' },
    },
  )
  .get(
    '/dispatches',
    async ({ query, user }) =>
      listNotificationDispatchesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          channel: query.channel,
          status: query.status,
          campaignId: query.campaignId,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        channel: t.Optional(t.String({ maxLength: 16 })),
        status: t.Optional(t.String({ maxLength: 24 })),
        campaignId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadNotificationHub),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'List notification dispatch logs' },
    },
  )
  .post(
    '/dispatches/:id/retry',
    async ({ params, user }) =>
      retryNotificationDispatchCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRetryNotificationMessages),
        requireModuleEnabled('notification_hub'),
      ],
      detail: { tags: ['Notification Hub'], summary: 'Retry failed notification dispatch' },
    },
  )
  .post(
    '/events/parcel-status-call',
    async ({ body, user }) =>
      sendParcelStatusNotificationCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        parcelId: body.parcelId,
        outcome: body.outcome,
        sendSms: body.sendSms ?? false,
        sendEmail: body.sendEmail ?? false,
        includeSecondReceiver: body.includeSecondReceiver ?? false,
      }),
    {
      body: t.Object({
        parcelId: UUID,
        outcome: t.String({ minLength: 1, maxLength: 50 }),
        sendSms: t.Optional(t.Boolean()),
        sendEmail: t.Optional(t.Boolean()),
        includeSecondReceiver: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanSendCallCenterNotifications,
          PermissionKeys.CanReadCallCenterParcelStatus,
        ),
        requireModuleEnabled('notification_hub'),
      ],
      detail: {
        tags: ['Notification Hub'],
        summary: 'Send call-center parcel status notifications',
      },
    },
  );
