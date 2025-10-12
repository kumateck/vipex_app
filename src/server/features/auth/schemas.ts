import { t } from 'elysia';

export const LoginBody = t.Object({
  email: t.String({ format: 'email', maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 128 }),
});

export const TokenPair = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
});

export const LoginResponse = t.Object({
  tokens: TokenPair,
  user: t.Object({
    id: t.String({ format: 'uuid' }),
    email: t.String({ format: 'email' }),
    fullname: t.String(),
    roleId: t.Optional(t.String({ format: 'uuid' })),
    companyId: t.Optional(t.String({ format: 'uuid' })),
    branchId: t.Optional(t.String({ format: 'uuid' })),
  }),
});

export const RefreshBody = t.Object({
  refreshToken: t.String(),
});

export const LogoutBody = RefreshBody;

export const ForgotPasswordBody = t.Object({
  email: t.String({ format: 'email' }),
});

export const ResetPasswordBody = t.Object({
  token: t.String(),
  password: t.String({ minLength: 8, maxLength: 128 }),
});

export const ChangePasswordBody = t.Object({
  oldPassword: t.String({ minLength: 8, maxLength: 128 }),
  newPassword: t.String({ minLength: 8, maxLength: 128 }),
});
