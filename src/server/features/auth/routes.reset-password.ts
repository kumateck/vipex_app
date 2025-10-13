import { Elysia, t } from 'elysia';
import { resetPasswordWithTokenSvc, validateResetTokenSvc } from './service.reset-password';

export const authPasswordRoutes = new Elysia({ name: 'auth-password' })
  // Optional: Validate token before showing "set password" form
  .get(
    '/auth/reset-password/validate',
    async ({ query, set }) => {
      const ok = await validateResetTokenSvc(query.token);
      if (!ok) {
        set.status = 400;
        return { valid: false };
      }
      return { valid: true };
    },
    {
      query: t.Object({ token: t.String() }),
      response: t.Object({ valid: t.Boolean() }),
      detail: {
        tags: ['Auth'],
        summary: 'Validate reset/setup token',
        operationId: 'validateResetPasswordToken',
      },
    },
  )
  // Main endpoint: verify token and set the new password
  .post(
    '/auth/reset-password',
    async ({ body }) => {
      const res = await resetPasswordWithTokenSvc(body.token, body.password);
      return res;
    },
    {
      body: t.Object({
        token: t.String(),
        password: t.String({ minLength: 8, maxLength: 128 }),
      }),
      response: t.Object({ success: t.Boolean() }),
      detail: {
        tags: ['Auth'],
        summary: 'Set password using invitation/reset token',
        operationId: 'resetPasswordWithToken',
      },
    },
  );
