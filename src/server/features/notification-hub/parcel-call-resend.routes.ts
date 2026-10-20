import { Elysia, t } from 'elysia';
import { UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireAnyPermissions,
  requireModuleEnabled,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { resendParcelCallNotificationSvc } from './services';

export const parcelCallResendRoutes = new Elysia({ name: 'parcel-call-notification-resend' })
  .use(authPlugin)
  .post(
    '/events/parcel-status-call/resend',
    async ({ body, user }) => {
      const actor = user as AuthUser;
      return resendParcelCallNotificationSvc({
        ...body,
        companyId: actor.companyId ?? '',
        branchId: actor.branchId ?? '',
        actorUserId: actor.sub,
        includeSecondReceiver: body.includeSecondReceiver ?? false,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        expectedOutcome: t.Union([
          t.Literal('pickup'),
          t.Literal('delivery'),
          t.Literal('follow_up'),
        ]),
        sendSms: t.Boolean(),
        sendEmail: t.Boolean(),
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
        summary: 'Resend notifications for an assigned saved call outcome',
      },
    },
  );
