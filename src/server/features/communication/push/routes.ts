import { Elysia, t } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { registerCommunicationPushToken, unregisterCommunicationPushToken } from './tokens';

const RegisterPushBodySchema = t.Object({
  token: t.String({ minLength: 1 }),
  platform: t.Optional(t.Union([t.Literal('ios'), t.Literal('android'), t.Literal('web')])),
});

const UnregisterPushBodySchema = t.Object({
  token: t.String({ minLength: 1 }),
});

export const CommunicationPushRoutes = new Elysia({ name: 'communication-push' })
  .use(authPlugin)
  .post(
    '/register',
    async ({ body, user }) => {
      const authUser = user as AuthUser | null;
      await registerCommunicationPushToken({
        companyId: authUser?.companyId ?? '',
        userId: authUser?.sub ?? '',
        token: body.token,
        platform: body.platform ?? null,
      });
      return { ok: true };
    },
    {
      body: RegisterPushBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/unregister',
    async ({ body, user }) => {
      const authUser = user as AuthUser | null;
      await unregisterCommunicationPushToken({
        companyId: authUser?.companyId ?? '',
        userId: authUser?.sub ?? '',
        token: body.token,
      });
      return { ok: true };
    },
    {
      body: UnregisterPushBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
