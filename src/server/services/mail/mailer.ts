import nodemailer from 'nodemailer';
import { env } from '../../utils/env';
import { logger as devLogger } from '../../utils/logger';

let transporter: nodemailer.Transporter | null = null;
let verifiedOnce = false;

function parseBool(v: unknown, fallback = false): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(s)) return true;
    if (['0', 'false', 'no', 'off'].includes(s)) return false;
  }
  return fallback;
}

function parseNum(v: unknown, fallback?: number): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function ensureConfig() {
  if (!env.SMTP_HOST) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS.',
    );
  }
}

function getFromAddress(): string {
  return (env.SMTP_FROM as string) || (env.SMTP_USER as string) || 'no-reply@localhost';
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporter) {
    ensureConfig();

    const secure = parseBool(env.SMTP_SECURE, false);
    const port = parseNum(env.SMTP_PORT, secure ? 465 : 587);

    // Good defaults for most providers
    const requireTLS = parseBool(env.SMTP_REQUIRE_TLS, !secure); // if not using port 465, enforce STARTTLS

    const pool = parseBool(env.SMTP_POOL, true);

    // Optional timeouts to avoid hanging
    const connectionTimeout = parseNum(env.SMTP_CONNECTION_TIMEOUT, 10000);
    const greetingTimeout = parseNum(env.SMTP_GREETING_TIMEOUT, 5000);

    // DO NOT log secrets. Only log non-sensitive basics if you must debug.
    if (parseBool(env.SMTP_DEBUG, false)) {
      devLogger.info('SMTP config:', {
        host: env.SMTP_HOST,
        port,
        secure,
        requireTLS,
        pool,
        connectionTimeout,
        greetingTimeout,
        from: getFromAddress(),
      });
    }

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST as string,
      port: port!,
      secure, // true for 465, false for 587/25
      pool,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER as string,
              pass: env.SMTP_PASS as string,
            }
          : undefined,
      requireTLS, // enforce STARTTLS when secure=false
      // tls: {
      //   minVersion: 'TLSv1.2',
      //   rejectUnauthorized, // set to false ONLY for local/self-signed testing
      // },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
      connectionTimeout,
      greetingTimeout,
    } as nodemailer.TransportOptions);
  }

  if (!verifiedOnce) {
    try {
      await transporter.verify();
      verifiedOnce = true;
      devLogger.info('📬 SMTP transporter verified');
    } catch (err) {
      devLogger.error('SMTP verification failed:', err);
      throw err;
    }
  }

  return transporter;
}

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
  replyTo?: string;
};

export async function sendMail(input: SendMailInput) {
  const tx = await getTransporter();
  const info = await tx.sendMail({
    from: input.from ?? getFromAddress(),
    to: Array.isArray(input.to) ? input.to.join(', ') : input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    headers: input.headers,
    replyTo: input.replyTo,
  });

  devLogger.info('📬 Email sent:', info.messageId);

  if ((env.SMTP_HOST as string | undefined)?.includes('ethereal.email')) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) devLogger.info('🔗 Ethereal preview URL:', url);
  }

  return info;
}
