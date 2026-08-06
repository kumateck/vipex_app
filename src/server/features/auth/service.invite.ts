import { sendPasswordSetupEmail } from '../../services/mail/templates/password-setup';
import { generateOtpCode, hashOtp } from '@/server/utils/otp';
import { setUserResetTokenRepo } from './repository.tokens';

export async function sendPasswordSetupInvite(userId: string, email: string) {
  const otp = generateOtpCode();
  const tokenHash = await hashOtp(email.trim().toLowerCase(), otp);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await setUserResetTokenRepo({ userId, tokenHash, expiresAt });

  try {
    await sendPasswordSetupEmail(email, otp);
  } catch (err) {
    console.error('Failed to send password setup email:', err);
  }
}
