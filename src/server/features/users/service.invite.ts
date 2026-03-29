import { sendPasswordSetupEmail } from '../../services/mail/templates/password-setup';
import { setUserResetTokenRepo } from '../auth/repository.tokens';

export async function sendPasswordSetupInvite(userId: string, email: string) {
  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

  // Store only a hash in DB
  const enc = new TextEncoder().encode(`${email.trim().toLowerCase()}:${otp}`);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  const tokenHash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // 48h expiry
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await setUserResetTokenRepo({ userId, tokenHash, expiresAt });

  try {
    await sendPasswordSetupEmail(email, otp);
  } catch (err) {
    console.error('Failed to send password setup email:', err);
  }
}
