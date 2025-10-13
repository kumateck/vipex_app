import { sendMail } from '../mailer';
import { env } from '../../../utils/env';

export function buildPasswordResetEmail(resetUrl: string, email: string) {
  const appName = 'Vipex';
  const subject = `${appName}: Reset your password`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for <strong>${email}</strong>.</p>
      <p>Click the button below to choose a new password. This link will expire in 30 minutes.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;">
          Reset password
        </a>
      </p>
      <p>If the button doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#6b7280;font-size:12px;">${appName} • ${new URL(env.APP_BASE_URL).origin}</p>
    </div>
  `;
  const text = `Reset your password

We received a request to reset the password for ${email}.
Open this link to choose a new password (valid for 30 minutes):

${resetUrl}

If you didn't request this, you can ignore this email.`;

  return { subject, html, text };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { subject, html, text } = buildPasswordResetEmail(resetUrl, to);
  // console.log(subject, html, text, 'email');
  return await sendMail({ to, subject, html, text });
}
