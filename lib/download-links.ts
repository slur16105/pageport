import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";

const LINK_LIFETIME_MS = 24 * 60 * 60_000;

export function hashDownloadToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createDownloadGrant(orderId: string, productSlug: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_LIFETIME_MS);
  await prisma.$transaction([
    prisma.downloadGrant.updateMany({
      where: { orderId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.downloadGrant.create({
      data: {
        orderId,
        tokenHash: hashDownloadToken(token),
        objectKey: `products/${productSlug}.pdf`,
        expiresAt,
      },
    }),
  ]);
  return { token, expiresAt };
}

export async function getExistingDownloadGrant(orderId: string) {
  return prisma.downloadGrant.findFirst({
    where: {
      orderId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      downloadCount: { lt: 5 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function downloadUrl(request: Request, token: string) {
  return new URL(`/api/download/${encodeURIComponent(token)}`, request.url).toString();
}
