import { randomBytes } from 'node:crypto';
import { env } from '../../utils/env';
import { sendPasswordSetupEmail } from '../../services/mail/templates/password-setup';
import { getUserInviteStateRepo, setUserResetTokenRepo } from './repository.tokens';

import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import { UserStatus } from '@/db/schemas/enums';

function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  return crypto.subtle.digest('SHA-256', enc).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  );
}

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
      `An active setup link already exists and expires at ${user.resetTokenExpires!.toISOString()}. Use force=true to regenerate.`,
    );
  }

  const tokenPlain = randomBytes(32).toString('hex');
  const tokenHash = await sha256Hex(tokenPlain);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await setUserResetTokenRepo({ userId: user.id, tokenHash, expiresAt });

  const setupUrlObj = new URL('/open-invite.html', env.INVITE_LINK_BASE_URL);
  setupUrlObj.searchParams.set('token', tokenPlain);
  const setupUrl = setupUrlObj.toString();
  try {
    await sendPasswordSetupEmail(user.email, setupUrl);
  } catch (err) {
    // Do not expose email provider errors to client—log and continue to return 200 to avoid enumeration
    console.error('Failed to send password setup email (resend):', err);
  }

  return { ok: true, expiresAt: expiresAt.toISOString() };
}
