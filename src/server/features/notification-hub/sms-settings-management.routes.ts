import { Elysia, t } from 'elysia';
import { NonEmpty255, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireAnyPermissions,
  requirePermissions,
} from '@/server/plugins/auth';
import { BadRequest } from '@/server/utils/http-error';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  createNotificationCampaignCtrl,
  createNotificationTemplateCtrl,
  getNotificationTemplateCtrl,
  listNotificationTemplatesCtrl,
  submitNotificationCampaignCtrl,
  updateNotificationTemplateCtrl,
} from './controller';
import { getSmsEventDefinition } from './sms-event-definitions';

const manageTemplates = requireAnyPermissions(
  PermissionKeys.CanManageNotificationTemplates,
  PermissionKeys.CanManageCompanyModules,
);

const createBulkSms = requireAnyPermissions(
  PermissionKeys.CanCreateNotificationCampaigns,
  PermissionKeys.CanManageCompanyModules,
);

const bulkSmsVariables = new Set(['recipientName', 'companyId', 'date']);
const smsVariablePattern = /{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g;

function validateBulkSmsBody(body: string) {
  const variables = [...body.matchAll(smsVariablePattern)].flatMap((match) => match[1] ?? []);
  const unsupported = [...new Set(variables.filter((variable) => !bulkSmsVariables.has(variable)))];
  if (unsupported.length) {
    throw BadRequest(`Unsupported bulk SMS variables: ${unsupported.join(', ')}`);
  }
}

const templateBody = t.Object({
  code: t.String({ minLength: 2, maxLength: 64 }),
  name: NonEmpty255,
  body: t.String({ minLength: 1, maxLength: 2000 }),
  variables: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 64 }))),
  isActive: t.Optional(t.Boolean()),
});

export const smsSettingsManagementRoutes = new Elysia({
  name: 'notification-hub-sms-settings-management',
})
  .use(authPlugin)
  .get(
    '/sms-settings/templates',
    async ({ query, user }) =>
      listNotificationTemplatesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          channel: 'sms',
          isActive: undefined,
        },
      }),
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String({ maxLength: 255 })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCompanyProfile)],
      detail: { tags: ['Notification Hub'], summary: 'List company SMS templates' },
    },
  )
  .post(
    '/sms-settings/templates',
    async ({ body, set, user }) => {
      if (getSmsEventDefinition(body.code)) {
        throw BadRequest('This code is reserved for an application SMS definition');
      }
      validateBulkSmsBody(body.body);
      const result = await createNotificationTemplateCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        channel: 'sms',
        code: body.code,
        name: body.name,
        subject: null,
        body: body.body,
        variablesJson: body.variables ?? [],
        isActive: body.isActive ?? true,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: templateBody,
      beforeHandle: [requireAuth(), manageTemplates],
      detail: { tags: ['Notification Hub'], summary: 'Create a reusable SMS template' },
    },
  )
  .patch(
    '/sms-settings/templates/:id',
    async ({ params, body, user }) => {
      const companyId = (user as AuthUser).companyId!;
      const existing = await getNotificationTemplateCtrl({ id: params.id, companyId });
      if (getSmsEventDefinition(existing.code)) {
        throw BadRequest('Application SMS definitions must be edited through their event action');
      }
      validateBulkSmsBody(body.body ?? existing.body);
      return updateNotificationTemplateCtrl({
        id: params.id,
        companyId,
        actorUserId: (user as AuthUser).sub,
        patch: {
          name: body.name,
          body: body.body,
          variablesJson: body.variables,
          isActive: body.isActive,
        },
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(NonEmpty255),
        body: t.Optional(t.String({ minLength: 1, maxLength: 2000 })),
        variables: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 64 }))),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), manageTemplates],
      detail: { tags: ['Notification Hub'], summary: 'Update a reusable SMS template' },
    },
  )
  .post(
    '/sms-settings/bulk-campaigns',
    async ({ body, set, user }) => {
      if (!body.templateId && !body.body?.trim()) {
        throw BadRequest('Select an SMS template or enter a new message');
      }
      const companyId = (user as AuthUser).companyId!;
      const actorUserId = (user as AuthUser).sub;
      const template = body.templateId
        ? await getNotificationTemplateCtrl({ id: body.templateId, companyId })
        : null;
      validateBulkSmsBody(body.body?.trim() || template?.body || '');
      const created = await createNotificationCampaignCtrl({
        companyId,
        createdBy: actorUserId,
        name: body.name,
        eventCode: 'bulk_sms',
        channel: 'sms',
        templateId: body.templateId ?? null,
        subjectOverride: null,
        bodyOverride: body.body?.trim() || null,
        audienceType: body.audienceType,
        scheduledAt: null,
      });
      if (body.submitForApproval) {
        await submitNotificationCampaignCtrl({ id: created.id, companyId, actorUserId });
      }
      set.status = HttpStatus.CREATED;
      return { id: created.id, submitted: body.submitForApproval ?? false };
    },
    {
      body: t.Object({
        name: NonEmpty255,
        templateId: t.Optional(t.Union([UUID, t.Null()])),
        body: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        audienceType: t.Union([
          t.Literal('customers_all'),
          t.Literal('users_all'),
          t.Literal('employees_all'),
          t.Literal('employees_birthday_today'),
        ]),
        submitForApproval: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), createBulkSms],
      detail: { tags: ['Notification Hub'], summary: 'Create a bulk SMS campaign' },
    },
  );
