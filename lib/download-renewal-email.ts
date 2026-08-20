import { downloadRenewedEmail } from "../emails/download-renewed";
import { env } from "./env";

export async function sendDownloadRenewalEmail(input: {
  buyerEmail: string;
  productTitle: string;
  orderId: string;
  downloadUrl: string;
  expiresAt: number;
}) {
  const runtimeEnv = env();
  const apiKey = runtimeEnv.RESEND_API_KEY;
  if (!apiKey?.startsWith("re_")) throw new Error("Resend 이메일 발송 설정이 필요합니다.");
  const template = await downloadRenewedEmail(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `download-renewed-${input.orderId}-${input.expiresAt}`,
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
  if (!response.ok || !result.id) throw new Error(result.message ?? "새 다운로드 주소 이메일을 보내지 못했습니다.");
}
