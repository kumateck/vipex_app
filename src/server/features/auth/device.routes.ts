import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAuth,
  requireHeadOffice,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { Forbidden } from '@/server/utils/http-error';
import { readDeviceCredential } from './device-headers';
import { isDeviceVerificationRequired } from './device-policy';
import {
  getDeviceStatusSvc,
  listDevicesSvc,
  registerDeviceSvc,
  reviewDeviceSvc,
} from './device.service';

const DeviceId = t.String({ minLength: 1, maxLength: 25 });
const DeviceStatus = t.Union([
  t.Literal('pending'),
  t.Literal('approved'),
  t.Literal('revoked'),
  t.Literal('blocked'),
  t.Literal('permanently_denied'),
]);

export const deviceRoutes = new Elysia({ name: 'registered-devices' })
  .use(authPlugin)
  .group('/auth/devices', (app) =>
    app
      .post(
        '/register',
        async ({ body, request }) => {
          const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
          return registerDeviceSvc({
            ...body,
            userAgent: request.headers.get('user-agent'),
            ip,
          });
        },
        {
          body: t.Object({
            email: t.String({ format: 'email', maxLength: 255 }),
            password: t.String({ minLength: 8, maxLength: 128 }),
            kind: t.Union([t.Literal('mobile'), t.Literal('desktop')]),
            deviceName: t.String({ minLength: 1, maxLength: 160 }),
            model: t.Optional(t.String({ maxLength: 120 })),
            osName: t.String({ minLength: 1, maxLength: 40 }),
            osVersion: t.Optional(t.String({ maxLength: 80 })),
            appVersion: t.Optional(t.String({ maxLength: 80 })),
          }),
          response: t.Object({ id: DeviceId, secret: t.String(), status: DeviceStatus }),
          detail: { tags: ['Auth'], summary: 'Request native device approval' },
        },
      )
      .get(
        '/access',
        async ({ user }) => ({
          required: await isDeviceVerificationRequired(user?.companyId),
        }),
        {
          beforeHandle: requireAuth(),
          response: t.Object({ required: t.Boolean() }),
          detail: { tags: ['Auth'], summary: 'Check native device access policy' },
        },
      )
      .get(
        '/status',
        async ({ request }) => {
          const credential = readDeviceCredential(request);
          if (!credential) throw Forbidden('Device credential required');
          return getDeviceStatusSvc(credential);
        },
        {
          response: t.Object({ id: DeviceId, status: DeviceStatus }),
          detail: { tags: ['Auth'], summary: 'Check device approval status' },
        },
      )
      .get(
        '/',
        async ({ user }) => {
          if (!user?.companyId) throw Forbidden('Company context required');
          return listDevicesSvc(user.companyId);
        },
        {
          beforeHandle: [
            requireAuth(),
            requireHeadOffice(),
            requirePermissions(PermissionKeys.CanUpdateUsers),
            requireModuleEnabled('device_verification'),
          ],
          detail: { tags: ['Auth'], summary: 'List registered devices for company' },
        },
      )
      .post(
        '/:id/review',
        async ({ params, body, user }) => {
          if (!user?.companyId) throw Forbidden('Company context required');
          return reviewDeviceSvc({
            id: params.id,
            companyId: user.companyId,
            reviewerId: user.sub,
            action: body.action,
            reason: body.reason,
          });
        },
        {
          params: t.Object({ id: DeviceId }),
          body: t.Object({
            action: t.Union([
              t.Literal('approve'),
              t.Literal('revoke'),
              t.Literal('block'),
              t.Literal('unblock'),
              t.Literal('permanently_deny'),
            ]),
            reason: t.Optional(t.String({ maxLength: 500 })),
          }),
          response: t.Object({ id: DeviceId, status: DeviceStatus }),
          beforeHandle: [
            requireAuth(),
            requireHeadOffice(),
            requirePermissions(PermissionKeys.CanUpdateUsers),
            requireModuleEnabled('device_verification'),
          ],
          detail: { tags: ['Auth'], summary: 'Approve, revoke, block, or deny a device' },
        },
      ),
  );
