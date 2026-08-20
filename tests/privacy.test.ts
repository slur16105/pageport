import { describe, expect, it } from "vitest";
import { scrubSensitiveUrl, scrubTelemetryEvent } from "../lib/privacy";

// 오류·방문 통계 서비스로 결제키나 다운로드 주소가 전송되지 않도록 가리는 기능을 확인합니다.
describe("민감 주소 제거", () => {
  it("결제 식별값은 지우고 일반 분석값은 유지한다", () => {
    expect(
      scrubSensitiveUrl(
        "https://pageport.example/payment/success?paymentKey=secret&orderId=PP-1&amount=4900&utm_source=test",
      ),
    ).toBe("https://pageport.example/payment/success?utm_source=test");
  });

  it("다운로드 토큰 경로를 가린다", () => {
    expect(scrubSensitiveUrl("https://pageport.example/api/download/private-token")).toBe(
      "https://pageport.example/api/download/[redacted]",
    );
  });

  it("Sentry 요청과 breadcrumb의 민감 주소를 함께 정리한다", () => {
    const event = scrubTelemetryEvent({
      request: {
        url: "https://pageport.example/payment/success?paymentKey=secret&orderId=PP-1",
        query_string: "paymentKey=secret",
        cookies: "private",
        data: { paymentKey: "secret" },
        headers: { referer: "https://pageport.example/payment/success?paymentKey=secret" },
      },
      breadcrumbs: [{ data: { url: "https://pageport.example/api/download/private-token" } }],
    });

    expect(event.request).toEqual({ url: "https://pageport.example/payment/success", headers: {} });
    expect(event.breadcrumbs?.[0]?.data?.url).toBe("https://pageport.example/api/download/[redacted]");
  });
});
