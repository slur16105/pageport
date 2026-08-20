import { z } from "zod";
import { env } from "../../../../lib/env";
import { prisma } from "../../../../lib/prisma";

const webhookSchema = z.object({
  eventType: z.string().min(1),
  createdAt: z.string().optional(),
  data: z
    .object({
      paymentKey: z.string().min(1),
      orderId: z.string().optional(),
      status: z.string().optional(),
      totalAmount: z.number().optional(),
    })
    .passthrough(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = webhookSchema.parse(body);
    const eventId =
      request.headers.get("x-toss-webhook-id") ||
      `${input.eventType}:${input.data.paymentKey}:${input.createdAt ?? "unknown"}`;
    const existing = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
    if (existing?.processedAt) return Response.json({ received: true, duplicate: true });
    await prisma.webhookEvent.upsert({
      where: { id: eventId },
      create: { id: eventId, eventType: input.eventType, paymentKey: input.data.paymentKey, payload: body },
      update: { payload: body },
    });

    const secret = env().TOSS_TEST_SECRET_KEY;
    const verifyResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${encodeURIComponent(input.data.paymentKey)}`,
      { headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` }, cache: "no-store" },
    );
    const verified = (await verifyResponse.json()) as {
      orderId?: string;
      status?: string;
      totalAmount?: number;
      approvedAt?: string;
      cancels?: Array<{ canceledAt?: string; cancelReason?: string }>;
    };
    if (!verifyResponse.ok || !verified.orderId) throw new Error("토스 결제 상태를 다시 확인하지 못했습니다.");
    const order = await prisma.order.findUnique({ where: { id: verified.orderId } });
    if (!order || order.paymentKey !== input.data.paymentKey || order.amount !== verified.totalAmount)
      throw new Error("웹훅 주문 정보가 PAGEPORT 장부와 일치하지 않습니다.");

    if (verified.status === "CANCELED" || verified.status === "PARTIAL_CANCELED") {
      const cancel = verified.cancels?.at(-1);
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "refunded",
            refundedAt: cancel?.canceledAt ? new Date(cancel.canceledAt) : new Date(),
            refundReason: cancel?.cancelReason ?? "토스 결제 취소 통지",
          },
        }),
        prisma.downloadGrant.updateMany({
          where: { orderId: order.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
    } else if (verified.status === "DONE" && !["paid", "test_paid"].includes(order.status)) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: order.isTest ? "test_paid" : "paid",
          approvedAt: verified.approvedAt ? new Date(verified.approvedAt) : new Date(),
        },
      });
    }
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: "processed", processedAt: new Date(), lastError: null },
    });
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "웹훅 처리 실패";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
