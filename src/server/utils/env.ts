// import "dotenv/config";
// import { z } from "zod";

// const EnvSchema = z.object({
//   NODE_ENV: z
//     .enum(["development", "test", "production"])
//     .default("development"),
//   PORT: z.coerce.number().int().positive().default(3000),
//   DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),
//   JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
//   JWT_ACCESS_EXPIRES: z.string().default("15m"), // e.g. 15m, 7d
//   JWT_REFRESH_EXPIRES: z.string().default("7d"), // e.g. 15m, 7d
//   // Sentry (optional; if DSN missing, integration is a no-op)
//   SENTRY_DSN: z.string().url().optional(),
//   SENTRY_ENV: z.string().default(process.env.NODE_ENV || "development"),
//   SENTRY_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1), // error events
//   SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0), // performance traces
//   SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0), // profiling
//   RELEASE: z.string().optional(), // e.g., git sha
// });

// const parsed = EnvSchema.safeParse(process.env);

// if (!parsed.success) {
//   console.error("Invalid environment configuration:");
//   for (const issue of parsed.error.issues) {
//     console.error(`- ${issue.path.join(".")}: ${issue.message}`);
//   }
//   process.exit(1);
// }

// export const env = parsed.data;
// export const isProd = env.NODE_ENV === "production";
// export const isDev = env.NODE_ENV === "development";

import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
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

  // Swagger toggle
  SWAGGER_ENABLED: z.string().default('true'),

  EMAIL_PASSWORD: z.string().min(1, 'EMAIL_PASSWORD is required for dev mail testing'),
  EMAIL_USER: z.string().min(1, 'EMAIL_USER is required for dev mail testing'),
  // SMTP (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false), // true for 465
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(), // e.g. 'Vipex <no-reply@domain.com>'
  SMTP_REQUIRE_TLS: z.coerce.boolean().default(true), // Enforce STARTTLS if not using port 465
  SMTP_TLS_REJECT_UNAUTHORIZED: z.coerce.boolean().default(true), // Reject invalid TLS certs
  SMTP_POOL: z.coerce.boolean().default(true), // Use pooled connections
  SMTP_MAX_CONNECTIONS: z.coerce.number().int().positive().default(5),
  SMTP_MAX_MESSAGES: z.coerce.number().int().positive().default(100),
  SMTP_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(10000), // ms
  SMTP_GREETING_TIMEOUT: z.coerce.number().int().positive().default(5000), // ms
  SMTP_DEBUG: z.coerce.boolean().default(false), // Log SMTP traffic (no credentials)
  // App URLs
  APP_BASE_URL: z.string().default(`http://localhost:${process.env.PORT || 3000}`),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues)
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
