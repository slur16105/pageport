import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureOrdersSchema } from "../../../../db/ensure-orders";
import { orders } from "../../../../db/schema";
import { verifyEmailToken } from "../../../../lib/email-verification";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; emailVerificationToken?: string };
    const email = payload.email?.trim().toLowerCase() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !payload.emailVerificationToken) {
      return Response.json({ error: "이메일 인증 정보를 확인해 주세요." }, { status: 400 });
    }
    if (!(await verifyEmailToken(email, payload.emailVerificationToken))) {
      return Response.json({ error: "이메일 인증이 만료되었습니다. 새 인증번호를 받아 주세요." }, { status: 403 });
    }

    await ensureOrdersSchema();
    const purchases = await getDb().select({
      orderId: orders.id,
      productTitle: orders.productTitle,
      sellerName: orders.sellerName,
      amount: orders.amount,
      purchasedAt: orders.approvedAt,
    }).from(orders).where(and(
      eq(orders.buyerEmail, email),
      inArray(orders.status, ["paid", "test_paid"]),
    )).orderBy(desc(orders.createdAt));

    return Response.json({ purchases });
  } catch (error) {
    const message = error instanceof Error ? error.message : "구매 상품을 불러오는 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
