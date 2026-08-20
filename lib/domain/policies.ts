// 이 파일은 다운로드와 환불이 가능한지를 판단하는 PAGEPORT의 핵심 운영 규칙을 모아 둡니다.
export type OrderStatus = "test_pending" | "pending" | "test_paid" | "paid" | "refunded";

export function mayDownload(input: {
  status: OrderStatus;
  expiresAt: Date;
  now: Date;
  count: number;
  max: number;
  revoked: boolean;
}) {
  // 환불·만료·횟수 초과 상태를 한곳에서 검사해 우회 다운로드를 막습니다.
  if (input.status === "refunded" || input.revoked) return { allowed: false, reason: "refunded" as const };
  if (!(["paid", "test_paid"] as OrderStatus[]).includes(input.status))
    return { allowed: false, reason: "unavailable" as const };
  if (input.expiresAt <= input.now) return { allowed: false, reason: "expired" as const };
  if (input.count >= input.max) return { allowed: false, reason: "limit" as const };
  return { allowed: true, reason: null };
}

export function mayRefund(input: { status: OrderStatus; downloadCount: number; reviewedAfterDownload: boolean }) {
  // 디지털 파일을 이미 받은 주문은 운영자가 사유를 확인한 뒤에만 환불할 수 있습니다.
  if (!(["paid", "test_paid"] as OrderStatus[]).includes(input.status))
    return { allowed: false, reason: "not-paid" as const };
  if (input.downloadCount > 0 && !input.reviewedAfterDownload)
    return { allowed: false, reason: "review-required" as const };
  return { allowed: true, reason: null };
}
