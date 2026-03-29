import { sendMail } from '../mailer';
import { env } from '../../../utils/env';

export function buildPasswordResetEmail(otpCode: string, email: string) {
  const appName = 'Vipex';
  const subject = `${appName}: Reset your password`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for <strong>${email}</strong>.</p>
      <p>Use this 6-digit OTP to reset your password. It expires in 30 minutes.</p>
      <p style="margin: 20px 0; font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otpCode}</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#6b7280;font-size:12px;">${appName} • ${new URL(env.APP_BASE_URL).origin}</p>
    </div>
  `;
  const text = `Reset your password

We received a request to reset the password for ${email}.
Use this 6-digit OTP to reset your password (valid for 30 minutes):

${otpCode}

If you didn't request this, you can ignore this email.`;

  return { subject, html, text };
}

export async function sendPasswordResetEmail(to: string, otpCode: string) {
  const { subject, html, text } = buildPasswordResetEmail(otpCode, to);
  return await sendMail({ to, subject, html, text });
}
