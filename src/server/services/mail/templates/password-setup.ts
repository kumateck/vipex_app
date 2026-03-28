import { sendMail } from '../mailer';
import { env } from '../../../utils/env';

function appBaseUrl() {
  return env.APP_BASE_URL || 'http://localhost:3000';
}

export function buildPasswordSetupEmail(otpCode: string, email: string) {
  const appName = 'Vipex';
  const subject = `${appName}: Set your password`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
      <h2>Welcome to ${appName}</h2>
      <p>Hi ${email}, your account has been created.</p>
      <p>Use this 6-digit OTP to set your password. It expires in 48 hours.</p>
      <p style="margin: 20px 0; font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otpCode}</p>
      <p>If you didn’t expect this email, you can ignore it.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#6b7280;font-size:12px;">${appName} • ${new URL(appBaseUrl()).origin}</p>
    </div>
  `;
  const text = `Welcome to ${appName}

Your account has been created. Use this 6-digit OTP to set your password (valid for 48 hours):

${otpCode}

If you didn't expect this, ignore this email.`;

  return { subject, html, text };
}

export async function sendPasswordSetupEmail(to: string, otpCode: string) {
  const { subject, html, text } = buildPasswordSetupEmail(otpCode, to);
  return await sendMail({ to, subject, html, text });
}
