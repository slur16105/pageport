import { env } from "../../../../lib/env";
import { prisma } from "../../../../lib/prisma";
import { downloadUrl, getOrCreatePurchaseDownloadGrant } from "../../../../lib/download-links";
import { sendPurchaseCompleteEmail } from "../../../../lib/purchase-email";
import { sendRefundCompleteEmail } from "../../../../lib/refund-email";
import { sendDownloadRenewalEmail } from "../../../../lib/download-renewal-email";

async function processEmailJob(
  job: { id: string; jobType: string; payload: unknown; attempts: number },
  request: Request,
) {
  const payload = job.payload as { orderId?: string; url?: string };
  if (!payload.orderId) throw new Error("작업에 주문번호가 없습니다.");
  const order = await prisma.order.findUnique({ where: { id: payload.orderId } });
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  if (job.jobType === "purchase_email") {
    if (order.receiptEmailSentAt) return;
    const grant = await getOrCreatePurchaseDownloadGrant(order.id, order.productSlug);
    if (!grant) throw new Error("기존 다운로드 주소가 만료되어 구매 이메일을 자동 재발송할 수 없습니다.");
    const emailId = await sendPurchaseCompleteEmail({
      buyerEmail: order.buyerEmail,
      productTitle: order.productTitle,
      sellerName: order.sellerName,
      orderId: order.id,
      amount: order.amount,
      downloadUrl: downloadUrl(request, grant.token),
      recoveryUrl: new URL(`/downloads/reissue?orderId=${encodeURIComponent(order.id)}`, request.url).toString(),
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { receiptEmailSentAt: new Date(), receiptEmailId: emailId },
    });
    return;
  }
  if (job.jobType === "refund_email") {
    if (order.refundEmailSentAt || !order.refundedAt || !order.refundReason) return;
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
    return;
  }
  if (job.jobType === "download_email" && payload.url) {
    await sendDownloadRenewalEmail({
      buyerEmail: order.buyerEmail,
      productTitle: order.productTitle,
      orderId: order.id,
      downloadUrl: payload.url,
      expiresAt: Date.now() + 24 * 60 * 60_000,
    });
    return;
  }
  throw new Error("지원하지 않는 작업입니다.");
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${env().CRON_SECRET}`)
    return Response.json({ error: "예약 작업 인증이 필요합니다." }, { status: 401 });
  const now = new Date();
  const [verifications, limits, tickets] = await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } } }),
    prisma.requestLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.uploadTicket.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  const jobs = await prisma.jobLedger.findMany({
    where: { status: "pending", nextRunAt: { lte: now }, attempts: { lt: 5 } },
    take: 25,
    orderBy: { nextRunAt: "asc" },
  });
  let completedJobs = 0;
  for (const job of jobs) {
    try {
      await prisma.jobLedger.update({ where: { id: job.id }, data: { attempts: { increment: 1 }, lockedAt: now } });
      await processEmailJob(job, request);
      await prisma.jobLedger.update({
        where: { id: job.id },
        data: { status: "completed", completedAt: new Date(), lastError: null },
      });
      completedJobs += 1;
    } catch (error) {
      await prisma.jobLedger.update({
        where: { id: job.id },
        data: {
          status: job.attempts + 1 >= 5 ? "failed" : "pending",
          nextRunAt: new Date(now.getTime() + Math.min(24, 2 ** job.attempts) * 60 * 60_000),
          lastError: error instanceof Error ? error.message.slice(0, 500) : "재처리 실패",
        },
      });
    }
  }
  return Response.json({
    ok: true,
    cleaned: { verifications: verifications.count, limits: limits.count, tickets: tickets.count },
    jobs: { attempted: jobs.length, completed: completedJobs },
  });
}
