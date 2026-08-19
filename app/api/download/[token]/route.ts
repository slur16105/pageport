import { and, eq, lt, sql } from "drizzle-orm";
import { getDb, getFiles } from "../../../../db";
import { ensureDownloadGrantsSchema } from "../../../../db/ensure-download-grants";
import { ensureOrdersSchema } from "../../../../db/ensure-orders";
import { downloadGrants, orders } from "../../../../db/schema";
import { verifyDownloadToken } from "../../../../lib/download-links";

type Props = { params: Promise<{ token: string }> };
const MAX_DOWNLOADS_PER_LINK = 5;

function downloadError(request: Request, reason: string, message: string, status: number) {
  if (request.headers.get("accept")?.includes("text/html")) {
    const url = new URL("/downloads/unavailable", request.url);
    url.searchParams.set("reason", reason);
    return new Response(null, { status: 303, headers: { Location: url.toString(), "Cache-Control": "private, no-store" } });
  }
  return Response.json({ error: message }, { status });
}

function downloadLimitResponse(request: Request) {
  return downloadError(request, "limit", "이 다운로드 주소는 5회 사용되어 닫혔습니다. 구매 이메일을 인증해 새 주소를 받아 주세요.", 410);
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { token } = await params;
    const verified = await verifyDownloadToken(decodeURIComponent(token));
    if (!verified) return downloadError(request, "expired", "다운로드 주소가 만료되었거나 올바르지 않습니다.", 410);

    await Promise.all([ensureDownloadGrantsSchema(), ensureOrdersSchema()]);
    const db = getDb();
    const [record] = await db.select({ grant: downloadGrants, orderStatus: orders.status }).from(downloadGrants)
      .innerJoin(orders, eq(downloadGrants.orderId, orders.id))
      .where(and(eq(downloadGrants.orderId, verified.orderId), eq(downloadGrants.expiresAt, verified.expiresAt)))
      .limit(1);
    if (!record || !["paid", "test_paid"].includes(record.orderStatus)) {
      return downloadError(request, record?.orderStatus === "refunded" ? "refunded" : "unavailable", "결제 완료 주문을 확인할 수 없습니다.", 403);
    }
    if (record.grant.downloadCount >= MAX_DOWNLOADS_PER_LINK) return downloadLimitResponse(request);

    const object = await getFiles().get(record.grant.objectKey);
    if (!object) return downloadError(request, "missing", "PDF 파일을 찾을 수 없습니다.", 404);

    const reserved = await db.update(downloadGrants).set({
      downloadCount: sql`${downloadGrants.downloadCount} + 1`,
      lastDownloadedAt: Date.now(),
    }).where(and(
      eq(downloadGrants.orderId, record.grant.orderId),
      lt(downloadGrants.downloadCount, MAX_DOWNLOADS_PER_LINK),
    )).returning({ orderId: downloadGrants.orderId });
    if (reserved.length === 0) return downloadLimitResponse(request);
    await db.update(orders).set({
      totalDownloadCount: sql`${orders.totalDownloadCount} + 1`,
    }).where(eq(orders.id, record.grant.orderId));

    const filename = `${record.grant.productSlug}.pdf`;
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(object.size ? { "Content-Length": String(object.size) } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF 다운로드 중 문제가 발생했습니다.";
    return downloadError(request, "unavailable", message, 500);
  }
}
