import 'dotenv/config';
import { z } from 'zod';

function normalizeAppBaseUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return parsed.origin;
  } catch {
    return null;
  }
}

const toBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production', 'test']).optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: toBoolean.optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  PASSWORD_COST: z.coerce.number().int().positive().default(10),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),

  // Observability (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENV: z.string().default(process.env.NODE_ENV || 'development'),
  SENTRY_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  RELEASE: z.string().optional(), // e.g., git sha
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  DISCORD_WEBHOOK_DEVELOPMENT: z.string().url().optional(),
  DISCORD_WEBHOOK_PRODUCTION: z.string().url().optional(),
  DISCORD_ALERT_MIN_STATUS: z.coerce.number().int().min(100).max(599).default(500),
  DISCORD_ALERT_COOLDOWN_MS: z.coerce.number().int().positive().default(60000),

  // Swagger toggle
  SWAGGER_ENABLED: z.string().default('true'),

  EMAIL_PASSWORD: z.string().min(1, 'EMAIL_PASSWORD is required for dev mail testing'),
  EMAIL_USER: z.string().min(1, 'EMAIL_USER is required for dev mail testing'),
  // SMTP (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: toBoolean.default(false), // true for 465
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(), // e.g. 'Vipex <no-reply@domain.com>'
  SMTP_REQUIRE_TLS: toBoolean.default(true), // Enforce STARTTLS if not using port 465
  SMTP_TLS_REJECT_UNAUTHORIZED: toBoolean.default(true), // Reject invalid TLS certs
  SMTP_POOL: toBoolean.default(true), // Use pooled connections
  SMTP_MAX_CONNECTIONS: z.coerce.number().int().positive().default(5),
  SMTP_MAX_MESSAGES: z.coerce.number().int().positive().default(100),
  SMTP_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(10000), // ms
  SMTP_GREETING_TIMEOUT: z.coerce.number().int().positive().default(5000), // ms
  SMTP_DEBUG: toBoolean.default(false), // Log SMTP traffic (no credentials)
  // App URLs
  APP_BASE_URL: z.string().optional(),
  RESET_LINK_BASE_URL: z.string().optional(),
  INVITE_LINK_BASE_URL: z.string().optional(),
  // MinIO / S3-compatible object storage (optional)
  MINIO_ENDPOINT: z.string().url().optional(),
  MINIO_REGION: z.string().default('us-east-1'),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().default('vipex-uploads'),
  MINIO_FORCE_PATH_STYLE: toBoolean.default(true),
  // Redis / rate limiting
  REDIS_URL: z.string().url().optional(),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  // LiveKit (optional)
  LIVEKIT_URL: z.string().url().optional(),
  LIVEKIT_PUBLIC_URL: z.string().url().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  // PostGIS
  POSTGIS_REQUIRED: toBoolean.default(false),

  // MTN SMS API (optional — used as a fallback when a company's SMS provider
  // configJson doesn't set its own apiUrl/subscriptionKey)
  MTN_SMS_API_BASE_URL: z.string().url().optional(),
  MTN_SMS_DEFAULT_SUBSCRIPTION_KEY: z.string().optional(),

  // MTN MoMo Collections API (optional — required only once a company enables MoMo)
  MTN_MOMO_API_BASE_URL: z.string().url().default('https://sandbox.momodeveloper.mtn.com'),
  MTN_MOMO_TARGET_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MTN_MOMO_CALLBACK_HOST: z.string().optional(),
  MTN_MOMO_SUBSCRIPTION_KEY: z.string().optional(),

  // mNotify SMS API (optional — used as a fallback when a company's SMS
  // provider configJson doesn't set its own apiUrl/apiKey/senderId)
  MNOTIFY_API_URL: z.string().url().optional(),
  MNOTIFY_API_KEY: z.string().optional(),
  MNOTIFY_SENDER_ID: z.string().optional(),

  // Help Assistant LLM providers (all optional — the assistant degrades
  // gracefully and falls back to plain guide browsing if none are set).
  // Each provider is tried in a per-tier priority order (see
  // src/server/features/help-assistant/providers/router.ts), so more than
  // one can be configured at once and different providers can answer
  // simple vs. complex questions. Model defaults below are conservative,
  // verified-available choices — review against each provider's current
  // model list before relying on them long-term.
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_SIMPLE_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  ANTHROPIC_COMPLEX_MODEL: z.string().default('claude-sonnet-5'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_SIMPLE_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_COMPLEX_MODEL: z.string().default('gpt-4o'),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_SIMPLE_MODEL: z.string().default('gemini-2.5-flash'),
  GOOGLE_COMPLEX_MODEL: z.string().default('gemini-2.5-pro'),
  HELP_ASSISTANT_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  HELP_ASSISTANT_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
  // Executive insights "Regenerate" is far more expensive per call (5 report
  // aggregations + 1 LLM call), so its budget is tighter than the Help Assistant's.
  EXECUTIVE_INSIGHTS_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(3600),
  EXECUTIVE_INSIGHTS_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  // AI chat "send message" can be up to 4 sequential LLM calls per turn (tool-calling agent loop).
  AI_CHAT_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(3600),
  AI_CHAT_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(15),
  // Fleet Anomaly Brief "Regenerate" runs 5 fleet report aggregations + 1 LLM call.
  FLEET_ANOMALY_BRIEF_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(3600),
  FLEET_ANOMALY_BRIEF_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  // Operations Exceptions Brief "Regenerate" runs 6 aggregations + 1 LLM call.
  OPERATIONS_EXCEPTIONS_BRIEF_RATE_LIMIT_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(3600),
  OPERATIONS_EXCEPTIONS_BRIEF_RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(5),
  // Management Daily Brief "Regenerate" reads 3 persisted sub-briefs + 1 LLM call, so it's
  // cheaper than the briefs it synthesizes and can afford a slightly higher budget.
  MANAGEMENT_DAILY_BRIEF_RATE_LIMIT_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(3600),
  MANAGEMENT_DAILY_BRIEF_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues)
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const inferredAppBaseUrl =
  normalizeAppBaseUrl(process.env.APP_BASE_URL) ??
  normalizeAppBaseUrl(process.env.APP_URL) ??
  normalizeAppBaseUrl(process.env.PUBLIC_APP_URL) ??
  normalizeAppBaseUrl(process.env.VERCEL_URL);

const fallbackLocalAppBaseUrl = `http://localhost:${parsed.data.PORT || 3000}`;
const resolvedAppBaseUrl = inferredAppBaseUrl ?? fallbackLocalAppBaseUrl;
const resolvedResetLinkBaseUrl =
  normalizeAppBaseUrl(process.env.RESET_LINK_BASE_URL) ?? resolvedAppBaseUrl;
const resolvedInviteLinkBaseUrl =
  normalizeAppBaseUrl(process.env.INVITE_LINK_BASE_URL) ?? resolvedAppBaseUrl;

if (parsed.data.NODE_ENV === 'production' && !inferredAppBaseUrl) {
  console.error(
    'Invalid environment configuration:\n- APP_BASE_URL: required in production (or APP_URL/PUBLIC_APP_URL/VERCEL_URL)',
  );
  process.exit(1);
}

export const env = {
  ...parsed.data,
  APP_ENV: parsed.data.APP_ENV ?? parsed.data.NODE_ENV,
  LOG_PRETTY: parsed.data.LOG_PRETTY ?? parsed.data.NODE_ENV !== 'production',
  APP_BASE_URL: resolvedAppBaseUrl,
  RESET_LINK_BASE_URL: resolvedResetLinkBaseUrl,
  INVITE_LINK_BASE_URL: resolvedInviteLinkBaseUrl,
  MTN_MOMO_CALLBACK_HOST:
    normalizeAppBaseUrl(parsed.data.MTN_MOMO_CALLBACK_HOST) ?? resolvedAppBaseUrl,
};
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
