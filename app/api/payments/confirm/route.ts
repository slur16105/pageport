// 이 파일은 토스 시험 결제를 최종 승인하고 구매 메일과 PDF 다운로드 권한을 발급합니다.
import { z } from "zod";
import { downloadUrl, getOrCreatePurchaseDownloadGrant } from "../../../../lib/download-links";
import { env } from "../../../../lib/env";
import { prisma } from "../../../../lib/prisma";
import { ensureTestProductFile } from "../../../../lib/product-files";
import { sendPurchaseCompleteEmail } from "../../../../lib/purchase-email";

const schema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

async function sendReceiptIfNeeded(request: Request, orderId: string, token: string) {
  // 메일이 이미 발송됐다면 중복 발송하지 않고, 실패하면 작업 장부에 남겨 다시 시도합니다.
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return false;
  if (order.receiptEmailSentAt) return true;
  try {
    const emailId = await sendPurchaseCompleteEmail({
      buyerEmail: order.buyerEmail,
      productTitle: order.productTitle,
      sellerName: order.sellerName,
      orderId: order.id,
      amount: order.amount,
      downloadUrl: downloadUrl(request, token),
      recoveryUrl: new URL(`/downloads/reissue?orderId=${encodeURIComponent(order.id)}`, request.url).toString(),
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { receiptEmailSentAt: new Date(), receiptEmailId: emailId },
    });
    return true;
  } catch (error) {
    await prisma.jobLedger.upsert({
      where: { jobKey: `purchase-email:${order.id}` },
      create: {
        jobKey: `purchase-email:${order.id}`,
        jobType: "purchase_email",
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
    const input = schema.parse(await request.json());
    const order = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) return Response.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    // 결제 화면에서 전달된 금액이 주문 장부와 다르면 승인하지 않아 금액 변조를 막습니다.
    if (order.amount !== input.amount)
      return Response.json({ error: "주문 금액이 일치하지 않아 결제를 중단했습니다." }, { status: 400 });
    if (order.status === "test_paid" && order.paymentKey === input.paymentKey) {
      await ensureTestProductFile(request, order.productSlug);
      const grant = await getOrCreatePurchaseDownloadGrant(order.id, order.productSlug);
      const emailSent = grant
        ? await sendReceiptIfNeeded(request, order.id, grant.token)
        : Boolean(order.receiptEmailSentAt);
      return Response.json({
        orderId: order.id,
        status: order.status,
        approvedAt: order.approvedAt,
        // 결제 주소의 정보는 다운로드 열쇠가 아닙니다. 재확인 때는 주소를 다시 노출하지 않습니다.
        downloadUrl: null,
        reissueRequired: !grant || !emailSent,
        emailSent,
      });
    }
    if (order.status !== "test_pending") return Response.json({ error: "이미 처리된 주문입니다." }, { status: 409 });

    // 브라우저 결과만 믿지 않고 서버 비밀키로 토스에 결제 승인을 직접 요청합니다.
    const secretKey = env().TOSS_TEST_SECRET_KEY;
    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `pageport-confirm-${order.id}`,
      },
      body: JSON.stringify({ paymentKey: input.paymentKey, orderId: order.id, amount: order.amount }),
    });
    const tossResult = (await tossResponse.json()) as { code?: string; message?: string; approvedAt?: string };
    if (!tossResponse.ok)
      return Response.json(
        { error: tossResult.message ?? "토스 시험 결제를 승인하지 못했습니다.", code: tossResult.code },
        { status: tossResponse.status },
      );

    const approvedAt = tossResult.approvedAt ? new Date(tossResult.approvedAt) : new Date();
    // 토스 승인이 성공한 뒤에만 주문을 결제 완료로 바꾸고 다운로드 주소를 만듭니다.
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "test_paid", paymentKey: input.paymentKey, approvedAt },
    });
    await ensureTestProductFile(request, order.productSlug);
    const grant = await getOrCreatePurchaseDownloadGrant(order.id, order.productSlug);
    if (!grant) throw new Error("구매 다운로드 주소를 만들지 못했습니다.");
    const emailSent = await sendReceiptIfNeeded(request, order.id, grant.token);
    return Response.json({
      orderId: order.id,
      status: "test_paid",
      approvedAt,
      downloadUrl: downloadUrl(request, grant.token),
      emailSent,
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "결제 확인 정보가 올바르지 않습니다."
        : error instanceof Error
          ? error.message
          : "결제 확인 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
