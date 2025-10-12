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
