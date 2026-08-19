import { desc, eq } from "drizzle-orm";
import { getD1, getDb } from "../../../../db";
import { ensureDownloadGrantsSchema } from "../../../../db/ensure-download-grants";
import { ensureOrdersSchema } from "../../../../db/ensure-orders";
import { downloadGrants, orders } from "../../../../db/schema";
import { isAdminRequest } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    await Promise.all([ensureOrdersSchema(), ensureDownloadGrantsSchema()]);
    await getD1().prepare(`UPDATE orders
      SET total_download_count = COALESCE((
        SELECT download_count FROM download_grants WHERE download_grants.order_id = orders.id
      ), 0)
      WHERE total_download_count = 0
        AND EXISTS (
          SELECT 1 FROM download_grants
          WHERE download_grants.order_id = orders.id AND download_grants.download_count > 0
        )`).run();
    const records = await getDb().select({
      orderId: orders.id,
      productTitle: orders.productTitle,
      sellerName: orders.sellerName,
      buyerEmail: orders.buyerEmail,
      amount: orders.amount,
      currency: orders.currency,
      status: orders.status,
      isTest: orders.isTest,
      approvedAt: orders.approvedAt,
      createdAt: orders.createdAt,
      downloadCount: orders.totalDownloadCount,
      lastDownloadedAt: downloadGrants.lastDownloadedAt,
      refundedAt: orders.refundedAt,
      refundReason: orders.refundReason,
      refundEmailSentAt: orders.refundEmailSentAt,
    }).from(orders).leftJoin(downloadGrants, eq(orders.id, downloadGrants.orderId)).orderBy(desc(orders.createdAt));
    return Response.json({ orders: records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "주문 목록을 불러오는 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
