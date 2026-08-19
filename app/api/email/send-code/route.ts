import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureEmailVerificationsSchema } from "../../../../db/ensure-email-verifications";
import { emailVerifications } from "../../../../db/schema";
import { verificationCodeEmail } from "../../../../emails/verification-code";
import { hashVerificationValue } from "../../../../lib/email-verification";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_INTERVAL_MS = 60_000;
const CODE_LIFETIME_MS = 10 * 60_000;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; purpose?: "checkout" | "redownload" | "admin" };
    const email = payload.email?.trim().toLowerCase() ?? "";
    const purpose = payload.purpose === "admin" ? "admin" : payload.purpose === "redownload" ? "redownload" : "checkout";
    if (!EMAIL_PATTERN.test(email)) return Response.json({ error: "이메일 주소를 다시 확인해 주세요." }, { status: 400 });
    const runtimeEnv = env as unknown as Record<string, string | undefined>;
    if (purpose === "admin" && email !== runtimeEnv.ADMIN_EMAIL?.trim().toLowerCase()) {
      return Response.json({ error: "관리자 이메일을 확인해 주세요." }, { status: 403 });
    }

    await ensureEmailVerificationsSchema();
    const db = getDb();
    const [existing] = await db.select().from(emailVerifications).where(eq(emailVerifications.email, email)).limit(1);
    const now = Date.now();
    if (existing && now - existing.lastSentAt < RESEND_INTERVAL_MS) {
      const retryAfter = Math.ceil((RESEND_INTERVAL_MS - (now - existing.lastSentAt)) / 1000);
      return Response.json({ error: `${retryAfter}초 후에 다시 요청해 주세요.`, retryAfter }, { status: 429 });
    }

    const apiKey = runtimeEnv.RESEND_API_KEY;
    if (!apiKey?.startsWith("re_")) return Response.json({ error: "Resend 이메일 발송 설정이 아직 필요합니다." }, { status: 503 });

    const code = crypto.getRandomValues(new Uint32Array(1))[0].toString().padStart(10, "0").slice(-6);
    const codeHash = await hashVerificationValue(`${email}:${code}`);
    const idempotencyKey = await hashVerificationValue(`send:${email}:${Math.floor(now / RESEND_INTERVAL_MS)}`);
    const template = verificationCodeEmail(code, purpose);
    const from = runtimeEnv.RESEND_FROM_EMAIL || "PAGEPORT <onboarding@resend.dev>";
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ from, to: [email], subject: template.subject, text: template.text, html: template.html }),
    });
    const emailResult = await emailResponse.json() as { id?: string; message?: string };
    if (!emailResponse.ok) {
      return Response.json({ error: emailResult.message ?? "인증번호 이메일을 보내지 못했습니다." }, { status: emailResponse.status });
    }

    await db.insert(emailVerifications).values({
      email,
      codeHash,
      verificationTokenHash: null,
      expiresAt: now + CODE_LIFETIME_MS,
      lastSentAt: now,
      attempts: 0,
      verifiedAt: null,
    }).onConflictDoUpdate({
      target: emailVerifications.email,
      set: { codeHash, verificationTokenHash: null, expiresAt: now + CODE_LIFETIME_MS, lastSentAt: now, attempts: 0, verifiedAt: null },
    });

    return Response.json({ sent: true, expiresInSeconds: CODE_LIFETIME_MS / 1000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "인증번호 발송 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
