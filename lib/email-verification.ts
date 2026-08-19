import { env } from "cloudflare:workers";
import { and, eq, gt, isNotNull } from "drizzle-orm";
import { getDb } from "../db";
import { ensureEmailVerificationsSchema } from "../db/ensure-email-verifications";
import { emailVerifications } from "../db/schema";

export function getEmailVerificationSecret() {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const secret = runtimeEnv.EMAIL_VERIFICATION_SECRET;
  if (!secret || secret.length < 24) throw new Error("EMAIL_VERIFICATION_SECRET 설정이 필요합니다.");
  return secret;
}

export async function hashVerificationValue(value: string) {
  const bytes = new TextEncoder().encode(`${getEmailVerificationSecret()}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyEmailToken(email: string, token: string) {
  await ensureEmailVerificationsSchema();
  const tokenHash = await hashVerificationValue(token);
  const [record] = await getDb().select({ email: emailVerifications.email }).from(emailVerifications).where(and(
    eq(emailVerifications.email, email),
    eq(emailVerifications.verificationTokenHash, tokenHash),
    isNotNull(emailVerifications.verifiedAt),
    gt(emailVerifications.expiresAt, Date.now()),
  )).limit(1);
  return Boolean(record);
}

export async function consumeEmailToken(email: string, token: string) {
  await ensureEmailVerificationsSchema();
  const tokenHash = await hashVerificationValue(token);
  const consumed = await getDb().update(emailVerifications).set({ verificationTokenHash: null }).where(and(
    eq(emailVerifications.email, email),
    eq(emailVerifications.verificationTokenHash, tokenHash),
    isNotNull(emailVerifications.verifiedAt),
    gt(emailVerifications.expiresAt, Date.now()),
  )).returning({ email: emailVerifications.email });
  return consumed.length === 1;
}
