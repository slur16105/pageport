import { createHash, createHmac, randomBytes } from "node:crypto";
import { env } from "./env";
import { prisma } from "./prisma";

const LINK_LIFETIME_MS = 24 * 60 * 60_000;

export function hashDownloadToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function purchaseDownloadToken(orderId: string) {
  return createHmac("sha256", env().DOWNLOAD_LINK_SECRET).update(`purchase:${orderId}`).digest("base64url");
}

function grantIsUsable(grant: {
  revokedAt: Date | null;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
}) {
  return !grant.revokedAt && grant.expiresAt > new Date() && grant.downloadCount < grant.maxDownloads;
}

/**
 * The first purchase link is deterministic so a retried payment confirmation can
 * return the same URL without revoking the link that was already emailed. Once a
 * customer reissues or exhausts that link, confirmation retries must not revive it.
 */
export async function getOrCreatePurchaseDownloadGrant(orderId: string, productSlug: string) {
  const token = purchaseDownloadToken(orderId);
  const tokenHash = hashDownloadToken(token);
  const deterministicGrant = await prisma.downloadGrant.findUnique({ where: { tokenHash } });

  if (deterministicGrant) {
    return grantIsUsable(deterministicGrant) ? { token, expiresAt: deterministicGrant.expiresAt } : null;
  }

  // A random grant means the buyer has already used the explicit reissue flow.
  // Its raw token is intentionally not stored, so do not replace or revive it.
  const activeGrant = await getExistingDownloadGrant(orderId);
  if (activeGrant) return null;

  const expiresAt = new Date(Date.now() + LINK_LIFETIME_MS);
  try {
    await prisma.downloadGrant.create({
      data: {
        orderId,
        tokenHash,
        objectKey: `products/${productSlug}.pdf`,
        expiresAt,
      },
    });
    return { token, expiresAt };
  } catch (error) {
    // Concurrent confirmation requests can race on the deterministic token.
    // Re-read it and return the winner instead of creating another grant.
    const concurrentGrant = await prisma.downloadGrant.findUnique({ where: { tokenHash } });
    if (concurrentGrant && grantIsUsable(concurrentGrant)) {
      return { token, expiresAt: concurrentGrant.expiresAt };
    }
    throw error;
  }
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
