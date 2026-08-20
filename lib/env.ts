import "server-only";

import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  SUPABASE_SECRET_KEY: z.string().min(20),
  RESEND_API_KEY: z.string().startsWith("re_"),
  RESEND_FROM_EMAIL: z.string().min(3),
  ADMIN_EMAIL: z.email(),
  EMAIL_VERIFICATION_SECRET: z.string().min(24),
  DOWNLOAD_LINK_SECRET: z.string().min(24),
  ADMIN_SESSION_SECRET: z.string().min(24),
  NEXT_PUBLIC_TOSS_TEST_CLIENT_KEY: z.string().startsWith("test_"),
  TOSS_TEST_SECRET_KEY: z.string().startsWith("test_"),
  TOSS_WEBHOOK_SECRET: z.string().min(24),
  CRON_SECRET: z.string().min(24),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

let cached: z.infer<typeof serverSchema> | undefined;

export function env() {
  cached ??= serverSchema.parse(process.env);
  return cached;
}
