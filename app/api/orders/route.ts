import { z } from "zod";
import { verifyEmailToken } from "../../../lib/email-verification";
import { prisma } from "../../../lib/prisma";
import { allowRequest, privacyHash, requestIp } from "../../../lib/request-security";

const inputSchema = z.object({
  productSlug: z.string().min(1),
  email: z.email(),
  emailVerificationToken: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    if (!(await allowRequest(`create-order:${privacyHash(requestIp(request))}`, 20, 3600)))
      return Response.json({ error: "주문 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    if (!(await verifyEmailToken(email, input.emailVerificationToken)))
      return Response.json({ error: "이메일 인증이 만료되었거나 올바르지 않습니다." }, { status: 400 });
    const product = await prisma.product.findFirst({ where: { slug: input.productSlug, status: "published" } });
    if (!product) return Response.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    const order = await prisma.order.create({
      data: {
        id: `PP-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        sellerName: product.sellerName,
        buyerEmail: email,
        amount: product.amount,
        status: "test_pending",
        isTest: true,
        emailVerifiedAt: new Date(),
      },
    });
    return Response.json(
      {
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          productTitle: order.productTitle,
          buyerEmail: order.buyerEmail,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "주문 정보를 다시 확인해 주세요."
        : error instanceof Error
          ? error.message
          : "주문 저장 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
