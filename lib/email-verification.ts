// 이 파일은 이메일 인증값을 안전하게 보관하고, 인증 완료 여부와 일회 사용을 확인합니다.
import { createHash } from "node:crypto";
import { env } from "./env";
import { prisma } from "./prisma";

export function hashVerificationValue(value: string) {
  // 원본 인증번호나 토큰 대신 되돌릴 수 없는 해시만 저장해 유출 위험을 줄입니다.
  return createHash("sha256").update(`${env().EMAIL_VERIFICATION_SECRET}:${value}`).digest("hex");
}

export async function verifyEmailToken(email: string, token: string) {
  const record = await prisma.emailVerification.findFirst({
    where: {
      email,
      verificationTokenHash: hashVerificationValue(token),
      verifiedAt: { not: null },
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: "desc" },
  });
  return Boolean(record);
}

export async function consumeEmailToken(email: string, token: string) {
  // 결제·재다운로드 같은 중요 작업에 사용한 인증 토큰은 즉시 폐기해 재사용을 막습니다.
  const record = await prisma.emailVerification.findFirst({
    where: {
      email,
      verificationTokenHash: hashVerificationValue(token),
      verifiedAt: { not: null },
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!record) return false;
  const result = await prisma.emailVerification.updateMany({
    where: { id: record.id, verificationTokenHash: record.verificationTokenHash },
    data: { verificationTokenHash: null },
  });
  return result.count === 1;
}
