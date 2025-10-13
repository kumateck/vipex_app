import { randomBytes } from 'node:crypto';
import { env } from '../../utils/env';
import { sendPasswordSetupEmail } from '../../services/mail/templates/password-setup';
import { setUserResetTokenRepo } from '../auth/repository.tokens';

export async function sendPasswordSetupInvite(userId: string, email: string) {
  // Opaque token for the link
  const tokenPlain = randomBytes(32).toString('hex');

  // Store only a hash in DB
  const enc = new TextEncoder().encode(tokenPlain);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  const tokenHash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // 48h expiry
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await setUserResetTokenRepo({ userId, tokenHash, expiresAt });

  const setupUrl = `${env.APP_BASE_URL}/set-password?token=${tokenPlain}`;
  try {
    await sendPasswordSetupEmail(email, setupUrl);
  } catch (err) {
    console.error('Failed to send password setup email:', err);
  }
}
