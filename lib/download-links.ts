// 이 파일은 구매자만 일정 시간과 횟수 안에서 쓸 수 있는 PDF 다운로드 주소를 관리합니다.
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
 * 최초 구매 주소는 결제 확인이 반복되어도 같은 주소를 유지합니다.
 * 구매자에게 이미 보낸 주소가 갑자기 무효가 되는 일을 막기 위한 처리입니다.
 * 단, 재발급했거나 모두 사용한 주소를 결제 재확인으로 되살리지는 않습니다.
 */
export async function getOrCreatePurchaseDownloadGrant(orderId: string, productSlug: string) {
  const token = purchaseDownloadToken(orderId);
  const tokenHash = hashDownloadToken(token);
  const deterministicGrant = await prisma.downloadGrant.findUnique({ where: { tokenHash } });

  if (deterministicGrant) {
    return grantIsUsable(deterministicGrant) ? { token, expiresAt: deterministicGrant.expiresAt } : null;
  }

  // 임의 토큰 주소가 이미 있다면 구매자가 재발급 절차를 거친 것이므로 새 주소로 덮어쓰지 않습니다.
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
    // 동시에 결제 확인 요청이 와도 먼저 만들어진 주소 하나만 사용해 중복 생성을 막습니다.
    const concurrentGrant = await prisma.downloadGrant.findUnique({ where: { tokenHash } });
    if (concurrentGrant && grantIsUsable(concurrentGrant)) {
      return { token, expiresAt: concurrentGrant.expiresAt };
    }
    throw error;
  }
}

export async function createDownloadGrant(orderId: string, productSlug: string) {
  // 새 주소를 발급할 때 이전 주소를 폐기해 유출된 예전 주소가 계속 쓰이지 않게 합니다.
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
