import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureEmailVerificationsSchema } from "../../../../db/ensure-email-verifications";
import { emailVerifications } from "../../../../db/schema";
import { hashVerificationValue } from "../../../../lib/email-verification";

const MAX_ATTEMPTS = 5;
const VERIFIED_LIFETIME_MS = 30 * 60_000;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; code?: string };
    const email = payload.email?.trim().toLowerCase() ?? "";
    const code = payload.code?.trim() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
      return Response.json({ error: "이메일과 6자리 인증번호를 확인해 주세요." }, { status: 400 });
    }

    await ensureEmailVerificationsSchema();
    const db = getDb();
    const [record] = await db.select().from(emailVerifications).where(eq(emailVerifications.email, email)).limit(1);
    if (!record || record.expiresAt <= Date.now()) return Response.json({ error: "인증번호가 만료되었습니다. 새 번호를 받아 주세요." }, { status: 400 });
    if (record.attempts >= MAX_ATTEMPTS) return Response.json({ error: "입력 횟수를 초과했습니다. 새 번호를 받아 주세요." }, { status: 429 });

    const codeHash = await hashVerificationValue(`${email}:${code}`);
    if (codeHash !== record.codeHash) {
      const attempts = record.attempts + 1;
      await db.update(emailVerifications).set({ attempts }).where(eq(emailVerifications.email, email));
      return Response.json({ error: attempts >= MAX_ATTEMPTS ? "입력 횟수를 초과했습니다. 새 번호를 받아 주세요." : `인증번호가 맞지 않습니다. ${MAX_ATTEMPTS - attempts}번 더 입력할 수 있습니다.` }, { status: 400 });
    }

    const verificationToken = crypto.randomUUID();
    const verificationTokenHash = await hashVerificationValue(verificationToken);
    await db.update(emailVerifications).set({ verificationTokenHash, verifiedAt: Date.now(), expiresAt: Date.now() + VERIFIED_LIFETIME_MS }).where(eq(emailVerifications.email, email));
    return Response.json({ verified: true, verificationToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "이메일 확인 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
