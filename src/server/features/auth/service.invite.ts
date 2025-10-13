import { randomBytes } from 'node:crypto';
import { env } from '../../utils/env';
import { sendPasswordSetupEmail } from '../../services/mail/templates/password-setup';
import { setUserResetTokenRepo } from './repository.tokens';

function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  return crypto.subtle.digest('SHA-256', enc).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  );
}

export async function sendPasswordSetupInvite(userId: string, email: string) {
  const tokenPlain = randomBytes(32).toString('hex');
  const tokenHash = await sha256Hex(tokenPlain);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await setUserResetTokenRepo({ userId, tokenHash, expiresAt });

  const setupUrl = `${env.APP_BASE_URL}/set-password?token=${tokenPlain}`;
  try {
    await sendPasswordSetupEmail(email, setupUrl);
  } catch (err) {
    console.error('Failed to send password setup email:', err);
  }
}
