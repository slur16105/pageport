import { createHash } from "node:crypto";
import { env } from "./env";
import { prisma } from "./prisma";

export function hashVerificationValue(value: string) {
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
