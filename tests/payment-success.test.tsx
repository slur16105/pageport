import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PaymentSuccess } from "../app/payment/success/PaymentSuccess";

describe("결제 성공 주소 보호", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("결제 확인에 필요한 값을 보낸 뒤 주소창 query를 즉시 지운다", async () => {
    window.history.replaceState({}, "", "/payment/success?paymentKey=test-key&orderId=PP-TEST&amount=4900");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        downloadUrl: "/api/download/token",
        emailSent: true,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PaymentSuccess payment={{ paymentKey: "test-key", orderId: "PP-TEST", amount: 4900 }} />);

    expect(window.location.href).not.toContain("paymentKey");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      paymentKey: "test-key",
      orderId: "PP-TEST",
      amount: 4900,
    });
  });
});
