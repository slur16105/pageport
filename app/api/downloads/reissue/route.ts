import { z } from "zod";
import { createDownloadGrant, downloadUrl } from "../../../../lib/download-links";
import { sendDownloadRenewalEmail } from "../../../../lib/download-renewal-email";
import { consumeEmailToken } from "../../../../lib/email-verification";
import { prisma } from "../../../../lib/prisma";

const schema = z.object({ orderId: z.string().min(1), email: z.email(), emailVerificationToken: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    const order = await prisma.order.findFirst({
      where: { id: input.orderId.trim(), buyerEmail: email, status: { in: ["paid", "test_paid"] } },
    });
    if (!order) return Response.json({ error: "해당 이메일의 결제 완료 주문을 찾을 수 없습니다." }, { status: 404 });
    if (!(await consumeEmailToken(email, input.emailVerificationToken)))
      return Response.json(
        { error: "이메일 인증이 만료되었거나 이미 사용되었습니다. 새 인증번호를 받아 주세요." },
        { status: 403 },
      );

    const grant = await createDownloadGrant(order.id, order.productSlug);
    const url = downloadUrl(request, grant.token);
    let emailSent = false;
    try {
      await sendDownloadRenewalEmail({
        buyerEmail: order.buyerEmail,
        productTitle: order.productTitle,
        orderId: order.id,
        downloadUrl: url,
        expiresAt: grant.expiresAt.getTime(),
      });
      emailSent = true;
    } catch {
      await prisma.jobLedger.upsert({
        where: { jobKey: `download-email:${order.id}:${grant.expiresAt.getTime()}` },
        create: {
          jobKey: `download-email:${order.id}:${grant.expiresAt.getTime()}`,
          jobType: "download_email",
          payload: { orderId: order.id, url },
        },
        update: {},
      });
    }
    return Response.json({ productTitle: order.productTitle, downloadUrl: url, emailSent });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "주문번호와 이메일 인증 정보를 확인해 주세요."
        : error instanceof Error
          ? error.message
          : "다운로드 주소 재발급 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
