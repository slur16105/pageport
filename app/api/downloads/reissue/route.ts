import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureOrdersSchema } from "../../../../db/ensure-orders";
import { orders } from "../../../../db/schema";
import { createDownloadGrant, downloadUrl, verifyDownloadToken } from "../../../../lib/download-links";
import { sendDownloadRenewalEmail } from "../../../../lib/download-renewal-email";
import { consumeEmailToken } from "../../../../lib/email-verification";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { orderId?: string; email?: string; emailVerificationToken?: string };
    const orderId = payload.orderId?.trim() ?? "";
    const email = payload.email?.trim().toLowerCase() ?? "";
    if (!orderId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !payload.emailVerificationToken) {
      return Response.json({ error: "주문번호와 이메일 인증 정보를 확인해 주세요." }, { status: 400 });
    }

    await ensureOrdersSchema();
    const [order] = await getDb().select().from(orders).where(and(
      eq(orders.id, orderId),
      eq(orders.buyerEmail, email),
      inArray(orders.status, ["paid", "test_paid"]),
    )).limit(1);
    if (!order) return Response.json({ error: "해당 이메일의 결제 완료 주문을 찾을 수 없습니다." }, { status: 404 });
    if (!(await consumeEmailToken(email, payload.emailVerificationToken))) {
      return Response.json({ error: "이메일 인증이 만료되었거나 이미 사용되었습니다. 새 인증번호를 받아 주세요." }, { status: 403 });
    }

    const token = await createDownloadGrant(order.id, order.productSlug);
    const url = downloadUrl(request, token);
    const verified = await verifyDownloadToken(token);
    let emailSent = false;
    try {
      await sendDownloadRenewalEmail({
        buyerEmail: order.buyerEmail,
        productTitle: order.productTitle,
        orderId: order.id,
        downloadUrl: url,
        expiresAt: verified?.expiresAt ?? Date.now(),
      });
      emailSent = true;
    } catch {
      // 화면에서 새 주소를 바로 제공하므로 이메일 장애가 재발급 자체를 막지 않습니다.
    }

    return Response.json({ productTitle: order.productTitle, downloadUrl: url, emailSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "다운로드 주소 재발급 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
