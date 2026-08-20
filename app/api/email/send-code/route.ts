// 이 파일은 결제·재다운로드·관리자 로그인에 사용할 6자리 인증번호를 이메일로 보냅니다.
import { z } from "zod";
import { verificationCodeEmail } from "../../../../emails/verification-code";
import { getAdminEmail } from "../../../../lib/admin-auth";
import { hashVerificationValue } from "../../../../lib/email-verification";
import { env } from "../../../../lib/env";
import { prisma } from "../../../../lib/prisma";
import { allowRequest, privacyHash, requestIp, verifyTurnstile } from "../../../../lib/request-security";

const inputSchema = z.object({
  email: z.email(),
  purpose: z.enum(["checkout", "redownload", "admin"]).default("checkout"),
  turnstileToken: z.string().optional(),
});
const RESEND_INTERVAL_MS = 60_000;
const CODE_LIFETIME_MS = 10 * 60_000;

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    if (input.purpose === "admin" && email !== getAdminEmail()) {
      return Response.json({ error: "관리자 이메일을 확인해 주세요." }, { status: 403 });
    }
    // 자동화 프로그램의 대량 발송 요청인지 확인해 이메일 서비스 악용을 막습니다.
    if (!(await verifyTurnstile(input.turnstileToken, request))) {
      return Response.json({ error: "자동 요청 확인에 실패했습니다. 다시 시도해 주세요." }, { status: 403 });
    }
    const ipKey = `send-code:ip:${privacyHash(requestIp(request))}`;
    const emailKey = `send-code:email:${privacyHash(email)}`;
    if (!(await allowRequest(ipKey, 10, 3600)) || !(await allowRequest(emailKey, 5, 3600))) {
      return Response.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }

    // 같은 사람이 연속으로 메일을 보내지 못하게 최소 1분 간격을 둡니다.
    const existing = await prisma.emailVerification.findUnique({
      where: { email_purpose: { email, purpose: input.purpose } },
    });
    const now = Date.now();
    if (existing && now - existing.lastSentAt.getTime() < RESEND_INTERVAL_MS) {
      const retryAfter = Math.ceil((RESEND_INTERVAL_MS - (now - existing.lastSentAt.getTime())) / 1000);
      return Response.json({ error: `${retryAfter}초 후에 다시 요청해 주세요.`, retryAfter }, { status: 429 });
    }

    // 예측하기 어려운 임의의 인증번호를 만들고 원문은 저장하지 않은 채 이메일로만 전달합니다.
    const code = crypto.getRandomValues(new Uint32Array(1))[0].toString().padStart(10, "0").slice(-6);
    const template = await verificationCodeEmail(code, input.purpose);
    const config = env();
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": hashVerificationValue(
          `send:${email}:${input.purpose}:${Math.floor(now / RESEND_INTERVAL_MS)}`,
        ),
      },
      body: JSON.stringify({
        from: config.RESEND_FROM_EMAIL,
        to: [email],
        subject: template.subject,
        text: template.text,
        html: template.html,
      }),
    });
    const emailResult = (await emailResponse.json()) as { message?: string };
    if (!emailResponse.ok)
      return Response.json(
        { error: emailResult.message ?? "인증번호 이메일을 보내지 못했습니다." },
        { status: emailResponse.status },
      );

    await prisma.emailVerification.upsert({
      where: { email_purpose: { email, purpose: input.purpose } },
      create: {
        email,
        purpose: input.purpose,
        codeHash: hashVerificationValue(`${email}:${code}`),
        expiresAt: new Date(now + CODE_LIFETIME_MS),
        lastSentAt: new Date(now),
      },
      update: {
        codeHash: hashVerificationValue(`${email}:${code}`),
        verificationTokenHash: null,
        expiresAt: new Date(now + CODE_LIFETIME_MS),
        lastSentAt: new Date(now),
        attempts: 0,
        verifiedAt: null,
      },
    });
    return Response.json({ sent: true, expiresInSeconds: CODE_LIFETIME_MS / 1000 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "이메일 주소를 다시 확인해 주세요."
        : error instanceof Error
          ? error.message
          : "인증번호 발송 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
