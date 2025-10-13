import { sendMail } from '../mailer';
import { env } from '../../../utils/env';

function appBaseUrl() {
  return env.APP_BASE_URL || 'http://localhost:3000';
}

export function buildPasswordSetupEmail(setupUrl: string, email: string) {
  const appName = 'Vipex';
  const subject = `${appName}: Set your password`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
      <h2>Welcome to ${appName}</h2>
      <p>Hi ${email}, your account has been created.</p>
      <p>Click the button below to set your password. This link will expire in 48 hours.</p>
      <p style="margin: 24px 0;">
        <a href="${setupUrl}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;">
          Set password
        </a>
      </p>
      <p>If the button doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${setupUrl}">${setupUrl}</a></p>
      <p>If you didn’t expect this email, you can ignore it.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#6b7280;font-size:12px;">${appName} • ${new URL(appBaseUrl()).origin}</p>
    </div>
  `;
  const text = `Welcome to ${appName}

Your account has been created. Set your password using the link below (valid for 48 hours):

${setupUrl}

If you didn't expect this, ignore this email.`;

  return { subject, html, text };
}

export async function sendPasswordSetupEmail(to: string, setupUrl: string) {
  const { subject, html, text } = buildPasswordSetupEmail(setupUrl, to);
  return await sendMail({ to, subject, html, text });
}
