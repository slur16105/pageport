export type OrderStatus = "test_pending" | "pending" | "test_paid" | "paid" | "refunded";

export function mayDownload(input: {
  status: OrderStatus;
  expiresAt: Date;
  now: Date;
  count: number;
  max: number;
  revoked: boolean;
}) {
  if (input.status === "refunded" || input.revoked) return { allowed: false, reason: "refunded" as const };
  if (!(["paid", "test_paid"] as OrderStatus[]).includes(input.status))
    return { allowed: false, reason: "unavailable" as const };
  if (input.expiresAt <= input.now) return { allowed: false, reason: "expired" as const };
  if (input.count >= input.max) return { allowed: false, reason: "limit" as const };
  return { allowed: true, reason: null };
}

export function mayRefund(input: { status: OrderStatus; downloadCount: number; reviewedAfterDownload: boolean }) {
  if (!(["paid", "test_paid"] as OrderStatus[]).includes(input.status))
    return { allowed: false, reason: "not-paid" as const };
  if (input.downloadCount > 0 && !input.reviewedAfterDownload)
    return { allowed: false, reason: "review-required" as const };
  return { allowed: true, reason: null };
}
