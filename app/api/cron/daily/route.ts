// 이 파일은 매일 만료 자료를 정리하고 실패한 이메일 발송을 자동으로 다시 시도합니다.
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
  // 이메일 종류에 따라 구매·환불·재다운로드 안내를 다시 보내고 성공 여부를 장부에 기록합니다.
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
  // 예약 작업 전용 비밀키를 확인해 외부인이 정리 작업을 임의로 실행하지 못하게 합니다.
  if (request.headers.get("authorization") !== `Bearer ${env().CRON_SECRET}`)
    return Response.json({ error: "예약 작업 인증이 필요합니다." }, { status: 401 });
  const now = new Date();
  const [verifications, limits, tickets] = await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } } }),
    prisma.requestLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.uploadTicket.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  // 한 번에 처리할 양과 재시도 횟수를 제한해 반복 실패가 서버에 부담을 주지 않게 합니다.
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
