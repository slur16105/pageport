import { describe, expect, it } from "vitest";
import { mayDownload, mayRefund } from "../lib/domain/policies";

describe("다운로드 정책", () => {
  const now = new Date("2026-08-20T00:00:00Z");
  it("결제 완료·유효기간·횟수 조건을 모두 확인한다", () =>
    expect(
      mayDownload({
        status: "test_paid",
        expiresAt: new Date("2026-08-21T00:00:00Z"),
        now,
        count: 4,
        max: 5,
        revoked: false,
      }).allowed,
    ).toBe(true));
  it("환불된 주문은 주소가 남아 있어도 차단한다", () =>
    expect(
      mayDownload({
        status: "refunded",
        expiresAt: new Date("2026-08-21T00:00:00Z"),
        now,
        count: 0,
        max: 5,
        revoked: false,
      }).reason,
    ).toBe("refunded"));
  it("5회를 사용한 주소를 차단한다", () =>
    expect(
      mayDownload({
        status: "paid",
        expiresAt: new Date("2026-08-21T00:00:00Z"),
        now,
        count: 5,
        max: 5,
        revoked: false,
      }).reason,
    ).toBe("limit"));
});

describe("환불 정책", () => {
  it("다운로드 전 결제 완료 주문은 환불할 수 있다", () =>
    expect(mayRefund({ status: "paid", downloadCount: 0, reviewedAfterDownload: false }).allowed).toBe(true));
  it("다운로드 후에는 운영자 검토가 필요하다", () =>
    expect(mayRefund({ status: "paid", downloadCount: 1, reviewedAfterDownload: false }).reason).toBe(
      "review-required",
    ));
});
