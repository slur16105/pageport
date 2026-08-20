// 이 파일은 로그인한 관리자에게 최신 주문·결제·다운로드·환불 현황을 보여 줍니다.
import { isAdminRequest } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    // 구매자 이메일과 결제 정보가 포함되므로 관리자 로그인 여부를 먼저 확인합니다.
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
