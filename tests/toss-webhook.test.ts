import { beforeEach, describe, expect, it, vi } from "vitest";

// 토스 서버와 데이터베이스를 실제로 호출하지 않고 웹훅 처리만 안전하게 시험하는 가짜 기능들입니다.
const mocks = vi.hoisted(() => ({
  eventFind: vi.fn(),
  eventUpsert: vi.fn(),
  eventUpdate: vi.fn(),
  orderFind: vi.fn(),
  orderUpdate: vi.fn(),
  allowRequest: vi.fn(),
}));

vi.mock("../lib/env", () => ({ env: () => ({ TOSS_TEST_SECRET_KEY: "test_secret" }) }));
vi.mock("../lib/request-security", () => ({
  allowRequest: mocks.allowRequest,
  privacyHash: (value: string) => `hash:${value}`,
  requestIp: () => "127.0.0.1",
}));
vi.mock("../lib/prisma", () => ({
  prisma: {
    webhookEvent: {
      findUnique: mocks.eventFind,
      upsert: mocks.eventUpsert,
      update: mocks.eventUpdate,
    },
    order: { findUnique: mocks.orderFind, update: mocks.orderUpdate },
  },
}));

import { POST } from "../app/api/webhooks/toss/route";

function webhookRequest(paymentKey = "test-payment-key") {
  // 토스페이먼츠가 결제 상태 변경 시 보내는 것과 같은 모양의 시험 요청을 만듭니다.
  return new Request("https://pageport.example/api/webhooks/toss", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "tosspayments-webhook-transmission-id": "transmission-1",
    },
    body: JSON.stringify({
      eventType: "PAYMENT_STATUS_CHANGED",
      createdAt: "2026-08-20T00:00:00.000000",
      data: { paymentKey, orderId: "PP-TEST", status: "DONE", totalAmount: 4900 },
    }),
  });
}

describe("토스 웹훅 검증", () => {
  // 각 시험은 이전 시험의 기록이 남지 않은 깨끗한 상태에서 시작합니다.
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.allowRequest.mockResolvedValue(true);
    mocks.eventFind.mockResolvedValue(null);
    mocks.eventUpsert.mockResolvedValue({});
    mocks.eventUpdate.mockResolvedValue({});
    mocks.orderUpdate.mockResolvedValue({});
  });

  it("Toss 조회가 실패한 요청은 웹훅 장부에 저장하지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));

    const response = await POST(webhookRequest());

    expect(response.status).toBe(500);
    expect(mocks.eventUpsert).not.toHaveBeenCalled();
  });

  it("승인됐지만 paymentKey 저장이 누락된 주문을 공식 조회값으로 복구한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          orderId: "PP-TEST",
          paymentKey: "test-payment-key",
          status: "DONE",
          totalAmount: 4900,
          approvedAt: "2026-08-20T00:00:00+09:00",
        }),
      ),
    );
    mocks.orderFind.mockResolvedValue({
      id: "PP-TEST",
      amount: 4900,
      paymentKey: null,
      status: "test_pending",
      isTest: true,
    });

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    expect(mocks.eventUpsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "transmission-1" } }));
    expect(mocks.orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "PP-TEST" },
        data: expect.objectContaining({ status: "test_paid", paymentKey: "test-payment-key" }),
      }),
    );
  });
});
