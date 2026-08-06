import { sendPasswordSetupEmail } from '../../services/mail/templates/password-setup';
import { getUserInviteStateRepo, setUserResetTokenRepo } from './repository.tokens';

import { BadRequest, Conflict, NotFound, ServiceUnavailable } from '../../utils/http-error';
import { UserStatus } from '@/db/schemas/enums';
import { generateOtpCode, hashOtp } from '@/server/utils/otp';

export async function resendSetupInviteSvc(userId: string, opts?: { force?: boolean }) {
  const force = !!opts?.force;
  const user = await getUserInviteStateRepo(userId);
  if (!user) throw NotFound('User not found');

  // Only allow resend for accounts still in setup state
  if (user.status !== UserStatus.INVITED) {
    throw BadRequest('User is not in INVITED state. Use forgot-password for active accounts.');
  }

  const now = new Date();
  const hasActiveToken = user.resetToken && user.resetTokenExpires && user.resetTokenExpires > now;

  if (hasActiveToken && !force) {
    throw Conflict(
      `An active setup OTP already exists and expires at ${user.resetTokenExpires!.toISOString()}. Use force=true to regenerate.`,
    );
  }

  const otp = generateOtpCode();
  const tokenHash = await hashOtp(user.email.trim().toLowerCase(), otp);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await setUserResetTokenRepo({ userId: user.id, tokenHash, expiresAt });

  try {
    await sendPasswordSetupEmail(user.email, otp);
  } catch (err) {
    console.error('Failed to send password setup email (resend):', err);
    // Restore prior token state so we do not invalidate a working OTP when delivery fails.
    await setUserResetTokenRepo({
      userId: user.id,
      tokenHash: user.resetToken ?? null,
      expiresAt: user.resetTokenExpires ?? null,
    });
    throw ServiceUnavailable('Failed to send invitation email. Please try again shortly.');
  }

  return { ok: true, expiresAt: expiresAt.toISOString() };
}
