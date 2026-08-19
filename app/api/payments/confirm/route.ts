import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureOrdersSchema } from "../../../../db/ensure-orders";
import { orders } from "../../../../db/schema";
import { createDownloadGrant, downloadUrl, getExistingDownloadGrant } from "../../../../lib/download-links";
import { ensureTestProductFile } from "../../../../lib/product-files";
import { sendPurchaseCompleteEmail } from "../../../../lib/purchase-email";

const OFFICIAL_DOCS_TEST_SECRET_KEY = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

type Order = typeof orders.$inferSelect;

async function sendReceiptIfNeeded(request: Request, order: Order, token: string) {
  if (order.receiptEmailSentAt) return true;
  try {
    const emailId = await sendPurchaseCompleteEmail({
      buyerEmail: order.buyerEmail,
      productTitle: order.productTitle,
      sellerName: order.sellerName,
      orderId: order.id,
      amount: order.amount,
      downloadUrl: downloadUrl(request, token),
      recoveryUrl: new URL("/downloads/reissue", request.url).toString(),
    });
    await getDb().update(orders).set({ receiptEmailSentAt: new Date().toISOString(), receiptEmailId: emailId }).where(eq(orders.id, order.id));
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { paymentKey?: string; orderId?: string; amount?: number };
    if (!payload.paymentKey || !payload.orderId || !Number.isInteger(payload.amount)) {
      return Response.json({ error: "결제 확인 정보가 올바르지 않습니다." }, { status: 400 });
    }

    await ensureOrdersSchema();
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, payload.orderId)).limit(1);
    if (!order) return Response.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    if (!order.isTest) return Response.json({ error: "시험 주문만 승인할 수 있습니다." }, { status: 400 });
    if (order.amount !== payload.amount) return Response.json({ error: "주문 금액이 일치하지 않아 결제를 중단했습니다." }, { status: 400 });
    if (order.status === "test_paid" && order.paymentKey === payload.paymentKey) {
      await ensureTestProductFile(request, order.productSlug);
      const existing = await getExistingDownloadGrant(order.id);
      const token = existing?.token ?? await createDownloadGrant(order.id, order.productSlug);
      const emailSent = await sendReceiptIfNeeded(request, order, token);
      return Response.json({ orderId: order.id, status: order.status, approvedAt: order.approvedAt, downloadUrl: downloadUrl(request, token), emailSent });
    }
    if (order.status !== "test_pending") return Response.json({ error: "이미 처리된 주문입니다." }, { status: 409 });

    const runtimeEnv = env as unknown as Record<string, string | undefined>;
    const secretKey = runtimeEnv.TOSS_TEST_SECRET_KEY || OFFICIAL_DOCS_TEST_SECRET_KEY;
    if (!secretKey.startsWith("test_")) {
      return Response.json({ error: "안전을 위해 시험용 토스 키만 사용할 수 있습니다." }, { status: 500 });
    }

    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey: payload.paymentKey, orderId: order.id, amount: order.amount }),
    });
    const tossResult = await tossResponse.json() as { code?: string; message?: string; approvedAt?: string };
    if (!tossResponse.ok) {
      return Response.json({ error: tossResult.message ?? "토스 시험 결제를 승인하지 못했습니다.", code: tossResult.code }, { status: tossResponse.status });
    }

    const approvedAt = tossResult.approvedAt ?? new Date().toISOString();
    await db.update(orders).set({ status: "test_paid", paymentKey: payload.paymentKey, approvedAt }).where(eq(orders.id, order.id));
    await ensureTestProductFile(request, order.productSlug);
    const token = await createDownloadGrant(order.id, order.productSlug);
    const emailSent = await sendReceiptIfNeeded(request, order, token);
    return Response.json({ orderId: order.id, status: "test_paid", approvedAt, downloadUrl: downloadUrl(request, token), emailSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "결제 확인 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
