import { hashPassword } from '../../utils/password';
import {
  clearUserResetTokenRepo,
  findUserByResetTokenRepo,
  setPasswordAndActivateUserRepo,
} from './repository.tokens';

function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  return crypto.subtle.digest('SHA-256', enc).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  );
}

// Validate a token without revealing user info (for UI pre-check)
export async function validateResetTokenSvc(tokenPlain: string): Promise<boolean> {
  const tokenHash = await sha256Hex(tokenPlain);
  const user = await findUserByResetTokenRepo(tokenHash);
  return !!user;
}

// Consume token, set password, activate user
export async function resetPasswordWithTokenSvc(tokenPlain: string, newPassword: string) {
  const tokenHash = await sha256Hex(tokenPlain);
  const user = await findUserByResetTokenRepo(tokenHash);
  if (!user) {
    // Replace with your BadRequest helper if you have one
    throw new Error('Invalid or expired token');
  }

  const passwordHash = await hashPassword(newPassword);

  await setPasswordAndActivateUserRepo({
    userId: user.id,
    passwordHash,
  });

  await clearUserResetTokenRepo(user.id);

  return { success: true };
}
