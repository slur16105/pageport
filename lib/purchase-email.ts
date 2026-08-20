import { purchaseCompleteEmail } from "../emails/purchase-complete";
import { env } from "./env";

type PurchaseEmailInput = {
  buyerEmail: string;
  productTitle: string;
  sellerName: string;
  orderId: string;
  amount: number;
  downloadUrl: string;
  recoveryUrl: string;
};

export async function sendPurchaseCompleteEmail(input: PurchaseEmailInput) {
  const runtimeEnv = env();
  const apiKey = runtimeEnv.RESEND_API_KEY;
  if (!apiKey?.startsWith("re_")) throw new Error("Resend 이메일 발송 설정이 필요합니다.");

  const template = await purchaseCompleteEmail(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `purchase-complete-${input.orderId}`,
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
  if (!response.ok || !result.id) throw new Error(result.message ?? "구매 완료 이메일을 보내지 못했습니다.");
  return result.id;
}
