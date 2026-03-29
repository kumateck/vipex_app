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
  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  const tokenHash = await sha256Hex(`${email.trim().toLowerCase()}:${otp}`);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await setUserResetTokenRepo({ userId, tokenHash, expiresAt });

  try {
    await sendPasswordSetupEmail(email, otp);
  } catch (err) {
    console.error('Failed to send password setup email:', err);
  }
}
