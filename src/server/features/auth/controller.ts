import {
  changePasswordSvc,
  forgotPasswordSvc,
  getCurrentUserProfileSvc,
  loginSvc,
  logoutSvc,
  refreshSvc,
  resetPasswordSvc,
  setPasswordSvc,
  getCurrentUserPermissionsSvc,
  updateCurrentUserProfileSvc,
  verifyCurrentUserPasswordSvc,
} from './service';

export async function loginCtrl(input: {
  email: string;
  password: string;
  ua?: string;
  ip?: string;
}) {
  const result = await loginSvc(input.email, input.password, input.ua, input.ip);
  return {
    ...result,
    permissions: result.user.permissions ?? [],
  };
}

export async function refreshCtrl(refreshToken: string) {
  const { accessToken, refreshToken: nextRefreshToken, user } = await refreshSvc(refreshToken);
  return {
    tokens: {
      accessToken,
      refreshToken: nextRefreshToken,
    },
    user,
    permissions: user.permissions ?? [],
  };
}

export async function logoutCtrl(refreshToken: string) {
  await logoutSvc(refreshToken);
  return { success: true };
}

export async function forgotPasswordCtrl(email: string) {
  await forgotPasswordSvc(email);
  return { success: true };
}

export async function resetPasswordCtrl(email: string, otp: string, password: string) {
  await resetPasswordSvc(email, otp, password);
  return { success: true };
}

export async function setPasswordCtrl(email: string, otp: string, password: string) {
  await setPasswordSvc(email, otp, password);
  return { success: true };
}

export async function changePasswordCtrl(userId: string, oldPassword: string, newPassword: string) {
  await changePasswordSvc(userId, oldPassword, newPassword);
  return { success: true };
}

export async function verifyCurrentUserPasswordCtrl(userId: string, password: string) {
  return verifyCurrentUserPasswordSvc(userId, password);
}

export async function currentUserPermissionsCtrl(userId: string) {
  const result = await getCurrentUserPermissionsSvc(userId);
  return { permissions: result.allPermissions };
}

export async function currentUserReadOnlyPermissionsCtrl(userId: string) {
  const result = await getCurrentUserPermissionsSvc(userId);
  return { readOnlyPermissions: result.readOnlyPermissions };
}

export async function currentUserProfileCtrl(userId: string) {
  return getCurrentUserProfileSvc(userId);
}

export async function updateCurrentUserProfileCtrl(
  userId: string,
  patch: { fullname?: string; telephone?: string },
) {
  return updateCurrentUserProfileSvc(userId, patch);
}
