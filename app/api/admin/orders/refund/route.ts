// 이 파일은 관리자가 주문을 확인하고 토스 결제를 환불하며 기존 다운로드 권한을 회수합니다.
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
  // 환불 메일 발송이 실패하면 작업 장부에 남겨 예약 작업이 나중에 다시 시도하게 합니다.
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
    // 환불은 결제 취소와 파일 권한 회수가 따르므로 관리자만 실행할 수 있습니다.
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

    // PAGEPORT 장부만 바꾸지 않고 토스에 실제 취소를 요청한 뒤 성공 결과를 저장합니다.
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
    // 환불 상태 변경과 다운로드 주소 폐기를 함께 처리해 환불 후 파일 접근을 막습니다.
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
