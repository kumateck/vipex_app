import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth } from '../../plugins/auth';
import {
  ChangePasswordBody,
  CurrentUserPermissionsResponse,
  CurrentUserReadOnlyPermissionsResponse,
  ForgotPasswordBody,
  LoginBody,
  LoginResponse,
  LogoutBody,
  RefreshBody,
  TokenPair,
  AuthUserResponse,
  PermissionsField,
  SetPasswordBody,
} from './schemas';
import {
  changePasswordCtrl,
  currentUserPermissionsCtrl,
  currentUserReadOnlyPermissionsCtrl,
  forgotPasswordCtrl,
  loginCtrl,
  logoutCtrl,
  refreshCtrl,
  resetPasswordCtrl,
  setPasswordCtrl,
} from './controller';

export const authRoutes = new Elysia({ name: 'auth' }).use(authPlugin).group('/auth', (app) =>
  app
    .post(
      '/login',
      async ({ body, request }) => {
        const ua = request.headers.get('user-agent') || undefined;
        const ip =
          (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || undefined;
        return await loginCtrl({
          email: body.email,
          password: body.password,
          ua,
          ip,
        });
      },
      {
        body: LoginBody,
        response: LoginResponse,
        detail: { tags: ['Auth'], summary: 'Login', operationId: 'login' },
      },
    )
    .post(
      '/refresh',
      async ({ body }) => {
        // Return controller result directly to match `response: t.Object({ tokens: TokenPair })`
        return await refreshCtrl(body.refreshToken);
      },
      {
        body: RefreshBody,
        response: t.Object({
          tokens: TokenPair,
          user: AuthUserResponse,
          permissions: PermissionsField,
        }),
        detail: {
          tags: ['Auth'],
          summary: 'Refresh',
          operationId: 'refresh',
        },
      },
    )
    .post(
      '/logout',
      async ({ body }) => {
        await logoutCtrl(body.refreshToken);
        return { success: true };
      },
      {
        body: LogoutBody,
        response: t.Object({ success: t.Boolean() }),
        detail: { tags: ['Auth'], summary: 'Logout', operationId: 'logout' },
      },
    )
    .post(
      '/forgot-password',
      async ({ body }) => {
        await forgotPasswordCtrl(body.email);
        return { success: true };
      },
      {
        body: ForgotPasswordBody,
        response: t.Object({ success: t.Boolean() }),
        detail: {
          tags: ['Auth'],
          summary: 'Forgot password',
          operationId: 'forgotPassword',
        },
      },
    )
    .post(
      '/reset-password',
      async ({ body }) => {
        await resetPasswordCtrl(body.email, body.otp, body.password);
        return { success: true };
      },
      {
        body: SetPasswordBody,
        response: t.Object({ success: t.Boolean() }),
        detail: {
          tags: ['Auth'],
          summary: 'Reset password with OTP',
          operationId: 'resetPassword',
        },
      },
    )
    .post(
      '/set-password',
      async ({ body }) => {
        await setPasswordCtrl(body.email, body.otp, body.password);
        return { success: true };
      },
      {
        body: SetPasswordBody,
        response: t.Object({ success: t.Boolean() }),
        detail: {
          tags: ['Auth'],
          summary: 'Set password with invitation OTP',
          operationId: 'setPassword',
        },
      },
    )
    .post(
      '/change-password',
      async ({ user, body }) => {
        await changePasswordCtrl(user!.sub, body.oldPassword, body.newPassword);
        return { success: true };
      },
      {
        body: ChangePasswordBody,
        response: t.Object({ success: t.Boolean() }),
        beforeHandle: requireAuth(),
        detail: {
          tags: ['Auth'],
          summary: 'Change password (authenticated)',
          operationId: 'changePassword',
          security: [{ bearerAuth: [] }],
        },
      },
    )
    .get('/me/permissions', async ({ user }) => currentUserPermissionsCtrl(user!.sub), {
      response: CurrentUserPermissionsResponse,
      beforeHandle: requireAuth(),
      detail: {
        tags: ['Auth'],
        summary: 'Get current user permissions',
        operationId: 'getCurrentUserPermissions',
        security: [{ bearerAuth: [] }],
      },
    })
    .get(
      '/me/permissions/read-only',
      async ({ user }) => currentUserReadOnlyPermissionsCtrl(user!.sub),
      {
        response: CurrentUserReadOnlyPermissionsResponse,
        beforeHandle: requireAuth(),
        detail: {
          tags: ['Auth'],
          summary: 'Get current user read-only permissions',
          operationId: 'getCurrentUserReadOnlyPermissions',
          security: [{ bearerAuth: [] }],
        },
      },
    ),
);
