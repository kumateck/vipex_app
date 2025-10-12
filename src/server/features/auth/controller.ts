import {
  changePasswordSvc,
  forgotPasswordSvc,
  loginSvc,
  logoutSvc,
  refreshSvc,
  resetPasswordSvc,
} from './service';

export async function loginCtrl(input: {
  email: string;
  password: string;
  ua?: string;
  ip?: string;
}) {
  return loginSvc(input.email, input.password, input.ua, input.ip);
}

export async function refreshCtrl(refreshToken: string) {
  const tokens = await refreshSvc(refreshToken);
  return { tokens };
}

export async function logoutCtrl(refreshToken: string) {
  await logoutSvc(refreshToken);
  return { success: true };
}

export async function forgotPasswordCtrl(email: string) {
  await forgotPasswordSvc(email);
  return { success: true };
}

export async function resetPasswordCtrl(token: string, password: string) {
  await resetPasswordSvc(token, password);
  return { success: true };
}

export async function changePasswordCtrl(userId: string, oldPassword: string, newPassword: string) {
  await changePasswordSvc(userId, oldPassword, newPassword);
  return { success: true };
}
