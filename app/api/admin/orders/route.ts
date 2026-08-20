import { isAdminRequest } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request)))
      return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({
      orders: orders.map((order) => ({
        orderId: order.id,
        productTitle: order.productTitle,
        sellerName: order.sellerName,
        buyerEmail: order.buyerEmail,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        isTest: order.isTest,
        approvedAt: order.approvedAt,
        createdAt: order.createdAt,
        downloadCount: order.totalDownloadCount,
        refundedAt: order.refundedAt,
        refundReason: order.refundReason,
        refundEmailSentAt: order.refundEmailSentAt,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "주문 목록을 불러오는 중 문제가 발생했습니다." },
      { status: 500 },
    );
  }
}
