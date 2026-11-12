import { listSessionBranchOptions } from './branch-session.service';
import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth } from '../../plugins/auth';
import {
  ChangePasswordBody,
  CurrentUserPermissionsResponse,
  CurrentUserProfileResponse,
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
  VerifyPasswordBody,
} from './schemas';
import {
  changePasswordCtrl,
  currentUserPermissionsCtrl,
  currentUserProfileCtrl,
  currentUserReadOnlyPermissionsCtrl,
  forgotPasswordCtrl,
  loginCtrl,
  logoutCtrl,
  refreshCtrl,
  resetPasswordCtrl,
  setPasswordCtrl,
  updateCurrentUserProfileCtrl,
  verifyCurrentUserPasswordCtrl,
} from './controller';
import { readDeviceCredential, readNativeClient } from './device-headers';
import { BadRequest } from '@/server/utils/http-error';

export const authRoutes = new Elysia({ name: 'auth' }).use(authPlugin).group('/auth', (app) =>
  app
    .post(
      '/login',
      async ({ body, request }) => {
        const ua = request.headers.get('user-agent') || undefined;
        const client = readNativeClient(request);
        if (
          !client &&
          (request.headers.has('x-vipex-device-id') || request.headers.has('x-vipex-device-secret'))
        ) {
          throw BadRequest('Device credential requires a native client type');
        }
        const ip =
          (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || undefined;
        return await loginCtrl({
          email: body.email,
          password: body.password,
          ua,
          ip,
          client,
          deviceCredential: readDeviceCredential(request),
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
      async ({ body, request }) => {
        // Return controller result directly to match `response: t.Object({ tokens: TokenPair })`
        return await refreshCtrl(
          body.refreshToken,
          readDeviceCredential(request),
          readNativeClient(request),
          body.switchBranch,
        );
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
      '/me/verify-password',
      async ({ user, body }) => {
        return verifyCurrentUserPasswordCtrl(user!.sub, body.password);
      },
      {
        body: VerifyPasswordBody,
        response: t.Object({ success: t.Boolean() }),
        beforeHandle: requireAuth(),
        detail: {
          tags: ['Auth'],
          summary: 'Verify current user password',
          operationId: 'verifyCurrentUserPassword',
          security: [{ bearerAuth: [] }],
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
    .get(
      '/me/branch-options',
      async ({ user, set }) => {
        if (!user?.branchId) throw BadRequest('An active branch is required');
        set.headers['cache-control'] = 'no-store';
        return listSessionBranchOptions(user.sub, {
          branchId: user.branchId,
          locationId: user.locationId ?? null,
        });
      },
      {
        beforeHandle: requireAuth(),
        detail: {
          tags: ['Auth'],
          summary: 'List branches and locations available for this session',
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
      '/me/profile',
      async ({ user }) => currentUserProfileCtrl(user!.sub, user!.switchedBranchScope),
      {
        response: CurrentUserProfileResponse,
        beforeHandle: requireAuth(),
        detail: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          operationId: 'getCurrentUserProfile',
          security: [{ bearerAuth: [] }],
        },
      },
    )
    .patch(
      '/me/profile',
      async ({ user, body }) => {
        return updateCurrentUserProfileCtrl(
          user!.sub,
          {
            fullname: body.fullname,
            telephone: body.telephone,
          },
          user!.switchedBranchScope,
        );
      },
      {
        body: t.Object({
          fullname: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
          telephone: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        }),
        beforeHandle: requireAuth(),
        detail: {
          tags: ['Auth'],
          summary: 'Update current user profile',
          operationId: 'updateCurrentUserProfile',
          security: [{ bearerAuth: [] }],
        },
      },
    )
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
