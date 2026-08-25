import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireAnyPermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { ddRiderDailyAnalyticsCtrl } from './controller';

export const riderDailyAnalyticsRoutes = new Elysia({ name: 'rider-daily-analytics' })
  .use(authPlugin)
  .get(
    '/dd/rider/daily-analytics',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return ddRiderDailyAnalyticsCtrl({
        riderUserId: authUser.sub,
        date: query.date ?? null,
      });
    },
    {
      query: t.Object({
        date: t.Optional(t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadRiderCurrentParcels,
          PermissionKeys.CanReadRiderHistory,
        ),
      ],
      detail: { tags: ['Deliveries'], summary: 'Rider daily delivery and collection analytics' },
    },
  );
