import { getDb } from "../../../db";
import { ensureOrdersSchema } from "../../../db/ensure-orders";
import { orders } from "../../../db/schema";
import { getPublishedProduct } from "../../../lib/catalog-products";
import { verifyEmailToken } from "../../../lib/email-verification";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { productSlug?: string; email?: string; emailVerificationToken?: string };
    const email = payload.email?.trim().toLowerCase() ?? "";
    const product = payload.productSlug ? await getPublishedProduct(payload.productSlug) : undefined;

    if (!product) return Response.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "이메일을 확인해 주세요." }, { status: 400 });
    if (!payload.emailVerificationToken || !(await verifyEmailToken(email, payload.emailVerificationToken))) {
      return Response.json({ error: "이메일 인증이 만료되었거나 올바르지 않습니다." }, { status: 400 });
    }

    await ensureOrdersSchema();
    const id = `PP-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const amount = Number(product.price.replace(/[^0-9]/g, ""));
    const [order] = await getDb().insert(orders).values({
      id,
      productSlug: product.slug,
      productTitle: product.title,
      sellerName: product.seller,
      buyerEmail: email,
      amount,
      status: "test_pending",
      isTest: true,
      emailVerifiedAt: new Date().toISOString(),
    }).returning();

    return Response.json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        productTitle: order.productTitle,
        buyerEmail: order.buyerEmail,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "주문 저장 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
