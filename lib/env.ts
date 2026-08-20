// 이 파일은 서비스 실행에 필요한 비밀키와 설정값이 빠졌거나 잘못되지 않았는지 검사합니다.
import "server-only";

import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  // 새 publishable 키는 JWT가 아니므로 TUS 이어올리기 요청에는 Legacy anon JWT를 따로 사용합니다.
  SUPABASE_TUS_ANON_KEY: z.string().min(20).optional(),
  SUPABASE_SECRET_KEY: z.string().min(20),
  RESEND_API_KEY: z.string().startsWith("re_"),
  RESEND_FROM_EMAIL: z.string().min(3),
  ADMIN_EMAIL: z.email(),
  ADMIN_EMAILS: z.string().optional(),
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
  // 서버 설정은 한 번만 검사하고 보관해 모든 기능이 같은 안전한 값을 사용하게 합니다.
  cached ??= serverSchema.parse(process.env);
  return cached;
}
