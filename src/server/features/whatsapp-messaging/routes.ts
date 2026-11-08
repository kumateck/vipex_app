import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { WHATSAPP_MODULE_CODE, getWhatsAppAvailabilitySvc } from './availability.service';
import {
  getWhatsAppSettingsSvc,
  saveWhatsAppProviderSvc,
  updateWhatsAppEventTemplateSvc,
} from './settings.service';
import { deleteWhatsAppBillingRateSvc, saveWhatsAppBillingRateSvc } from './billing-rates.service';
import { getWhatsAppSpendReportSvc } from './spend.service';
import { sendWhatsAppTestSvc } from './test-send.service';

const tags = ['WhatsApp Messaging'];
const moduleGate = requireModuleEnabled(WHATSAPP_MODULE_CODE);
const manageProviders = requireAnyPermissions(
  PermissionKeys.CanManageNotificationProviders,
  PermissionKeys.CanManageCompanyModules,
);
const manageTemplates = requireAnyPermissions(
  PermissionKeys.CanManageNotificationTemplates,
  PermissionKeys.CanManageCompanyModules,
);
const viewSpend = requireAnyPermissions(
  PermissionKeys.CanViewWhatsAppSpend,
  PermissionKeys.CanManageCompanyModules,
);
// Meta's raw cost, margin and client prices are managed by platform managers only.
const canManageBilling = (user: unknown) =>
  ((user as AuthUser).permissions ?? []).includes(PermissionKeys.CanManageCompanyModules);
const companyOf = (user: unknown) => (user as AuthUser).companyId!;
const actorOf = (user: unknown) => (user as AuthUser).sub;

export const whatsappMessagingRoutes = new Elysia({ name: 'whatsapp-messaging' })
  .use(authPlugin)
  // Not module-gated on purpose: cashier screens use it to decide whether to show WhatsApp.
  .get('/availability', async ({ user }) => getWhatsAppAvailabilitySvc(companyOf(user)), {
    beforeHandle: [requireAuth()],
    detail: { tags, summary: 'Whether WhatsApp is enabled and configured for this company' },
  })
  .get('/settings', async ({ user }) => getWhatsAppSettingsSvc(companyOf(user)), {
    beforeHandle: [
      requireAuth(),
      requirePermissions(PermissionKeys.CanReadCompanyProfile),
      moduleGate,
    ],
    detail: { tags, summary: 'Get WhatsApp provider and template settings (secrets masked)' },
  })
  .put(
    '/settings/provider',
    async ({ body, user }) =>
      saveWhatsAppProviderSvc({ ...body, companyId: companyOf(user), actorUserId: actorOf(user) }),
    {
      body: t.Object({
        phoneNumberId: t.String({ minLength: 3, maxLength: 64 }),
        wabaId: t.Optional(t.String({ maxLength: 64 })),
        apiVersion: t.Optional(t.String({ maxLength: 16, pattern: '^(v\\d+\\.\\d+)?$' })),
        accessToken: t.Optional(t.String({ maxLength: 1024 })),
        appSecret: t.Optional(t.String({ maxLength: 256 })),
        webhookVerifyToken: t.Optional(t.String({ maxLength: 256 })),
        isActive: t.Boolean(),
      }),
      beforeHandle: [requireAuth(), manageProviders, moduleGate],
      detail: { tags, summary: 'Save WhatsApp Cloud API credentials' },
    },
  )
  .put(
    '/settings/events/:eventCode',
    async ({ params, body, user }) =>
      updateWhatsAppEventTemplateSvc({
        companyId: companyOf(user),
        actorUserId: actorOf(user),
        eventCode: params.eventCode,
        templateName: body.templateName,
        language: body.language,
      }),
    {
      params: t.Object({ eventCode: t.String({ minLength: 2, maxLength: 80 }) }),
      body: t.Object({
        templateName: t.String({ minLength: 1, maxLength: 512 }),
        language: t.String({ minLength: 2, maxLength: 10 }),
      }),
      beforeHandle: [requireAuth(), manageTemplates, moduleGate],
      detail: { tags, summary: 'Set the approved Meta template used for an application event' },
    },
  )
  .post(
    '/settings/test',
    async ({ body, user }) =>
      sendWhatsAppTestSvc({
        companyId: companyOf(user),
        phone: body.phone,
        template: body.template,
      }),
    {
      body: t.Object({
        phone: t.String({ minLength: 9, maxLength: 20 }),
        // Application event code, or "hello_world" for Meta's public test numbers.
        template: t.Optional(t.String({ minLength: 2, maxLength: 80 })),
      }),
      beforeHandle: [requireAuth(), manageProviders, moduleGate],
      detail: { tags, summary: 'Send a test WhatsApp template with sample values to a phone' },
    },
  )
  .get(
    '/spend',
    async ({ query, user }) =>
      getWhatsAppSpendReportSvc({
        companyId: companyOf(user),
        from: query.from,
        to: query.to,
        includeMetaCost: canManageBilling(user),
      }),
    {
      query: t.Object({
        from: t.String({ minLength: 10, maxLength: 10 }),
        to: t.String({ minLength: 10, maxLength: 10 }),
      }),
      beforeHandle: [requireAuth(), viewSpend, moduleGate],
      detail: { tags, summary: 'WhatsApp spend report for a period (client bill)' },
    },
  )
  .put(
    '/spend/rates',
    async ({ body, user }) =>
      saveWhatsAppBillingRateSvc({
        ...body,
        companyId: companyOf(user),
        actorUserId: actorOf(user),
      }),
    {
      body: t.Object({
        // Prices apply to messages sent on or after this date until the next price starts.
        effectiveFrom: t.String({ minLength: 10, maxLength: 10 }),
        currency: t.String({ minLength: 3, maxLength: 3 }),
        authentication: t.Number({ minimum: 0, maximum: 100 }),
        utility: t.Number({ minimum: 0, maximum: 100 }),
        marketing: t.Number({ minimum: 0, maximum: 100 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompanyModules),
        moduleGate,
      ],
      detail: { tags, summary: 'Add or replace a client price period for WhatsApp messages' },
    },
  )
  .delete(
    '/spend/rates/:id',
    async ({ params, user }) =>
      deleteWhatsAppBillingRateSvc({
        id: params.id,
        companyId: companyOf(user),
        actorUserId: actorOf(user),
      }),
    {
      params: t.Object({ id: t.String({ minLength: 1, maxLength: 25 }) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompanyModules),
        moduleGate,
      ],
      detail: { tags, summary: 'Delete a client price period for WhatsApp messages' },
    },
  );
