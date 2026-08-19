import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { ensureOrdersSchema } from "../../../../../db/ensure-orders";
import { orders } from "../../../../../db/schema";
import { isAdminRequest } from "../../../../../lib/admin-auth";
import { sendRefundCompleteEmail } from "../../../../../lib/refund-email";

const OFFICIAL_DOCS_TEST_SECRET_KEY = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

type Order = typeof orders.$inferSelect;

async function sendRefundEmailIfNeeded(order: Order) {
  if (order.refundEmailSentAt || !order.refundedAt || !order.refundReason) return Boolean(order.refundEmailSentAt);
  try {
    const emailId = await sendRefundCompleteEmail({
      buyerEmail: order.buyerEmail,
      productTitle: order.productTitle,
      orderId: order.id,
      amount: order.amount,
      reason: order.refundReason,
      refundedAt: order.refundedAt,
      isTest: order.isTest,
    });
    await getDb().update(orders).set({ refundEmailSentAt: new Date().toISOString(), refundEmailId: emailId }).where(eq(orders.id, order.id));
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    const payload = (await request.json()) as { orderId?: string; reason?: string; reviewedAfterDownload?: boolean };
    const orderId = payload.orderId?.trim() ?? "";
    const reason = payload.reason?.trim().slice(0, 200) ?? "";
    if (!orderId) return Response.json({ error: "주문 정보를 확인해 주세요." }, { status: 400 });

    await ensureOrdersSchema();
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return Response.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    if (order.status === "refunded") {
      const emailSent = await sendRefundEmailIfNeeded(order);
      return Response.json({ refunded: true, status: order.status, emailSent });
    }
    if (!reason) return Response.json({ error: "환불 사유를 입력해 주세요." }, { status: 400 });
    if (!["paid", "test_paid"].includes(order.status) || !order.paymentKey) {
      return Response.json({ error: "결제 완료 주문만 환불할 수 있습니다." }, { status: 409 });
    }
    if (order.totalDownloadCount > 0 && !payload.reviewedAfterDownload) {
      return Response.json({ error: "다운로드된 주문은 파일 오류나 설명 불일치를 검토한 뒤 환불할 수 있습니다." }, { status: 409 });
    }

    const runtimeEnv = env as unknown as Record<string, string | undefined>;
    const secretKey = order.isTest ? (runtimeEnv.TOSS_TEST_SECRET_KEY || OFFICIAL_DOCS_TEST_SECRET_KEY) : runtimeEnv.TOSS_SECRET_KEY;
    if (!secretKey) return Response.json({ error: "토스 실운영 환불 키 설정이 필요합니다." }, { status: 500 });

    const tossResponse = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(order.paymentKey)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `pageport-refund-${order.id}`,
      },
      body: JSON.stringify({ cancelReason: reason }),
    });
    const tossResult = await tossResponse.json() as { message?: string; cancels?: Array<{ canceledAt?: string }> };
    if (!tossResponse.ok) return Response.json({ error: tossResult.message ?? "토스 결제 환불을 완료하지 못했습니다." }, { status: tossResponse.status });

    const refundedAt = tossResult.cancels?.at(-1)?.canceledAt ?? new Date().toISOString();
    await db.update(orders).set({ status: "refunded", refundedAt, refundReason: reason }).where(eq(orders.id, order.id));
    const emailSent = await sendRefundEmailIfNeeded({ ...order, status: "refunded", refundedAt, refundReason: reason });
    return Response.json({ refunded: true, status: "refunded", refundedAt, emailSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "환불 처리 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
