import { z } from "zod";
import { isAdminRequest } from "../../../../../lib/admin-auth";
import { env } from "../../../../../lib/env";
import { prisma } from "../../../../../lib/prisma";
import { sendRefundCompleteEmail } from "../../../../../lib/refund-email";

const schema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().max(200).optional(),
  reviewedAfterDownload: z.boolean().optional(),
});

async function sendRefundEmail(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.refundedAt || !order.refundReason) return false;
  if (order.refundEmailSentAt) return true;
  try {
    const emailId = await sendRefundCompleteEmail({
      buyerEmail: order.buyerEmail,
      productTitle: order.productTitle,
      orderId: order.id,
      amount: order.amount,
      reason: order.refundReason,
      refundedAt: order.refundedAt.toISOString(),
      isTest: order.isTest,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { refundEmailSentAt: new Date(), refundEmailId: emailId },
    });
    return true;
  } catch (error) {
    await prisma.jobLedger.upsert({
      where: { jobKey: `refund-email:${order.id}` },
      create: {
        jobKey: `refund-email:${order.id}`,
        jobType: "refund_email",
        payload: { orderId: order.id },
        lastError: error instanceof Error ? error.message.slice(0, 500) : "send failed",
      },
      update: { status: "pending", nextRunAt: new Date() },
    });
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request)))
      return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    const input = schema.parse(await request.json());
    const order = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) return Response.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    if (order.status === "refunded")
      return Response.json({ refunded: true, status: order.status, emailSent: await sendRefundEmail(order.id) });
    if (!input.reason) return Response.json({ error: "환불 사유를 입력해 주세요." }, { status: 400 });
    if (!["paid", "test_paid"].includes(order.status) || !order.paymentKey)
      return Response.json({ error: "결제 완료 주문만 환불할 수 있습니다." }, { status: 409 });
    if (order.totalDownloadCount > 0 && !input.reviewedAfterDownload)
      return Response.json(
        { error: "다운로드된 주문은 파일 오류나 설명 불일치를 검토한 뒤 환불할 수 있습니다." },
        { status: 409 },
      );

    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${encodeURIComponent(order.paymentKey)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${env().TOSS_TEST_SECRET_KEY}:`).toString("base64")}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `pageport-refund-${order.id}`,
        },
        body: JSON.stringify({ cancelReason: input.reason }),
      },
    );
    const tossResult = (await tossResponse.json()) as { message?: string; cancels?: Array<{ canceledAt?: string }> };
    if (!tossResponse.ok)
      return Response.json(
        { error: tossResult.message ?? "토스 결제 환불을 완료하지 못했습니다." },
        { status: tossResponse.status },
      );
    const refundedAt = tossResult.cancels?.at(-1)?.canceledAt
      ? new Date(tossResult.cancels.at(-1)!.canceledAt!)
      : new Date();
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "refunded", refundedAt, refundReason: input.reason },
      }),
      prisma.downloadGrant.updateMany({
        where: { orderId: order.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return Response.json({
      refunded: true,
      status: "refunded",
      refundedAt,
      emailSent: await sendRefundEmail(order.id),
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "환불 정보를 확인해 주세요."
        : error instanceof Error
          ? error.message
          : "환불 처리 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
