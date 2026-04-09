import { t } from 'elysia';
import { UUID } from '../../schemas/common';

export const LoginBody = t.Object({
  email: t.String({ format: 'email', maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 128 }),
});

export const TokenPair = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
});

export const PermissionsField = t.Array(t.String());

export const AuthUserResponse = t.Object({
  id: UUID,
  email: t.String({ format: 'email' }),
  fullname: t.String(),
  employeeId: t.Optional(t.Union([UUID, t.Null()])),
  company: t.Optional(
    t.Union([
      t.Object({
        id: UUID,
        name: t.String(),
        useAccounting: t.Boolean(),
      }),
      t.Null(),
    ]),
  ),
  branch: t.Optional(
    t.Union([
      t.Object({
        id: UUID,
        name: t.String(),
        type: t.Number(),
      }),
      t.Null(),
    ]),
  ),
  location: t.Optional(
    t.Union([
      t.Object({
        id: UUID,
        name: t.String(),
      }),
      t.Null(),
    ]),
  ),
  locationId: t.Optional(t.Union([UUID, t.Null()])),
  locationName: t.Optional(t.Union([t.String(), t.Null()])),
  userType: t.Optional(t.Number()),
  cashierType: t.Optional(t.Union([t.Number(), t.Null()])),
  role: t.Optional(
    t.Union([
      t.Object({
        id: UUID,
        name: t.String(),
      }),
      t.Null(),
    ]),
  ),
  permissions: t.Optional(t.Array(t.String())),
});

export const LoginResponse = t.Object({
  tokens: TokenPair,
  user: AuthUserResponse,
  permissions: PermissionsField,
});

export const RefreshBody = t.Object({
  refreshToken: t.String(),
});

export const LogoutBody = RefreshBody;

export const ForgotPasswordBody = t.Object({
  email: t.String({ format: 'email' }),
});

export const OTPCode = t.String({ pattern: '^[0-9]{6}$' });

export const ResetPasswordBody = t.Object({
  email: t.String({ format: 'email' }),
  otp: OTPCode,
  password: t.String({ minLength: 8, maxLength: 128 }),
});

export const SetPasswordBody = t.Object({
  email: t.String({ format: 'email' }),
  otp: OTPCode,
  password: t.String({ minLength: 8, maxLength: 128 }),
});

export const ChangePasswordBody = t.Object({
  oldPassword: t.String({ minLength: 8, maxLength: 128 }),
  newPassword: t.String({ minLength: 8, maxLength: 128 }),
});

export const VerifyPasswordBody = t.Object({
  password: t.String({ minLength: 1, maxLength: 128 }),
});

export const CurrentUserPermissionsResponse = t.Object({
  permissions: t.Array(t.String()),
});

export const CurrentUserReadOnlyPermissionsResponse = t.Object({
  readOnlyPermissions: t.Array(t.String()),
});
