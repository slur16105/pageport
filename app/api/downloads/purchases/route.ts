import { z } from "zod";
import { verifyEmailToken } from "../../../../lib/email-verification";
import { prisma } from "../../../../lib/prisma";

const schema = z.object({ email: z.email(), emailVerificationToken: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    if (!(await verifyEmailToken(email, input.emailVerificationToken)))
      return Response.json({ error: "이메일 인증이 만료되었습니다. 새 인증번호를 받아 주세요." }, { status: 403 });
    const purchases = await prisma.order.findMany({
      where: { buyerEmail: email, status: { in: ["paid", "test_paid"] } },
      select: { id: true, productTitle: true, sellerName: true, amount: true, approvedAt: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({
      purchases: purchases.map((order) => ({
        orderId: order.id,
        productTitle: order.productTitle,
        sellerName: order.sellerName,
        amount: order.amount,
        purchasedAt: order.approvedAt,
      })),
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "이메일 인증 정보를 확인해 주세요."
        : error instanceof Error
          ? error.message
          : "구매 상품을 불러오는 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
