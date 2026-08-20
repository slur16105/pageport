import { z } from "zod";
import { hashVerificationValue } from "../../../../lib/email-verification";
import { prisma } from "../../../../lib/prisma";
import { allowRequest, privacyHash, requestIp } from "../../../../lib/request-security";

const inputSchema = z.object({ email: z.email(), code: z.string().regex(/^\d{6}$/) });
const MAX_ATTEMPTS = 5;
const VERIFIED_LIFETIME_MS = 30 * 60_000;

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    if (!(await allowRequest(`verify-code:${privacyHash(requestIp(request))}`, 30, 3600))) {
      return Response.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }
    const record = await prisma.emailVerification.findFirst({ where: { email }, orderBy: { updatedAt: "desc" } });
    if (!record || record.expiresAt <= new Date())
      return Response.json({ error: "인증번호가 만료되었습니다. 새 번호를 받아 주세요." }, { status: 400 });
    if (record.attempts >= MAX_ATTEMPTS)
      return Response.json({ error: "입력 횟수를 초과했습니다. 새 번호를 받아 주세요." }, { status: 429 });

    if (hashVerificationValue(`${email}:${input.code}`) !== record.codeHash) {
      const attempts = record.attempts + 1;
      await prisma.emailVerification.update({ where: { id: record.id }, data: { attempts } });
      return Response.json(
        {
          error:
            attempts >= MAX_ATTEMPTS
              ? "입력 횟수를 초과했습니다. 새 번호를 받아 주세요."
              : `인증번호가 맞지 않습니다. ${MAX_ATTEMPTS - attempts}번 더 입력할 수 있습니다.`,
        },
        { status: 400 },
      );
    }

    const verificationToken = crypto.randomUUID();
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: {
        verificationTokenHash: hashVerificationValue(verificationToken),
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + VERIFIED_LIFETIME_MS),
      },
    });
    return Response.json({ verified: true, verificationToken });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "이메일과 6자리 인증번호를 확인해 주세요."
        : error instanceof Error
          ? error.message
          : "이메일 확인 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
