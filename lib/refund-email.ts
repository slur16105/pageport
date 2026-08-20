// 이 파일은 환불이 끝난 주문의 금액과 사유를 구매자 이메일로 안내합니다.
import { refundCompleteEmail } from "../emails/refund-complete";
import { env } from "./env";

type RefundEmailInput = {
  buyerEmail: string;
  productTitle: string;
  orderId: string;
  amount: number;
  reason: string;
  refundedAt: string;
  isTest: boolean;
};

export async function sendRefundCompleteEmail(input: RefundEmailInput) {
  const runtimeEnv = env();
  const apiKey = runtimeEnv.RESEND_API_KEY;
  if (!apiKey?.startsWith("re_")) throw new Error("Resend 이메일 발송 설정이 필요합니다.");

  // 주문번호를 고유 발송값으로 사용해 환불 안내가 중복 발송되지 않도록 합니다.
  const template = await refundCompleteEmail(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `refund-complete-${input.orderId}`,
    },
    body: JSON.stringify({
      from: runtimeEnv.RESEND_FROM_EMAIL || "PAGEPORT <onboarding@resend.dev>",
      to: [input.buyerEmail],
      subject: template.subject,
      text: template.text,
      html: template.html,
    }),
  });
  const result = (await response.json()) as { id?: string; message?: string };
  if (!response.ok || !result.id) throw new Error(result.message ?? "환불 완료 이메일을 보내지 못했습니다.");
  return result.id;
}
