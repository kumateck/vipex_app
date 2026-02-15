import { Elysia, t } from 'elysia';
import { HttpStatus } from '../utils/http-status';
import { sendMail } from '../services/mail/mailer';

export const devMailRoutes = new Elysia({ name: 'dev-mail' })
  // Primary GET endpoint
  .get(
    '/dev/mail-test',
    async ({ query, set }) => {
      const to = query.to || process.env.SMTP_USER || 'test@example.com';

      try {
        const info = await sendMail({
          to,
          subject: query.subject || 'SMTP dev test',
          text: query.text || 'This is a test email from dev-mail.',
          html: query.html,
        });

        set.status = HttpStatus.OK;
        return {
          ok: true,
          messageId: info.messageId,
          envelope: info.envelope,
        };
      } catch (err) {
        const error = err as { message?: string; code?: string; command?: string };
        set.status = HttpStatus.INTERNAL_SERVER_ERROR;
        return {
          ok: false,
          error: String(error?.message || err),
          code: error?.code,
          command: error?.command,
        };
      }
    },
    {
      query: t.Object({
        to: t.Optional(t.String()),
        subject: t.Optional(t.String()),
        text: t.Optional(t.String()),
        html: t.Optional(t.String()),
      }),
      detail: { tags: ['Dev'], summary: 'Send a test email (GET)' },
    },
  )
  // Optional POST variant
  .post(
    '/dev/mail-test',
    async ({ body, set }) => {
      const to = body.to || process.env.SMTP_USER || 'test@example.com';

      try {
        const info = await sendMail({
          to,
          subject: body.subject || 'SMTP dev test',
          text: body.text || 'This is a test email from dev-mail.',
          html: body.html,
        });

        set.status = HttpStatus.OK;
        return {
          ok: true,
          messageId: info.messageId,
          envelope: info.envelope,
        };
      } catch (err) {
        const error = err as { message?: string; code?: string; command?: string };
        set.status = HttpStatus.INTERNAL_SERVER_ERROR;
        return {
          ok: false,
          error: String(error?.message || err),
          code: error?.code,
          command: error?.command,
        };
      }
    },
    {
      body: t.Object({
        to: t.Optional(t.String()),
        subject: t.Optional(t.String()),
        text: t.Optional(t.String()),
        html: t.Optional(t.String()),
      }),
      detail: { tags: ['Dev'], summary: 'Send a test email (POST)' },
    },
  )
  // Trailing slash redirects
  .get(
    '/dev/mail-test/',
    () => new Response(null, { status: HttpStatus.PERMANENT_REDIRECT, headers: { Location: '/dev/mail-test' } }),
  );
