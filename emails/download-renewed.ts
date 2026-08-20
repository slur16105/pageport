import { renderPageportEmail } from "./render";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export async function downloadRenewedEmail(input: { productTitle: string; orderId: string; downloadUrl: string }) {
  const title = escapeHtml(input.productTitle);
  const orderId = escapeHtml(input.orderId);
  const url = escapeHtml(input.downloadUrl);
  return {
    subject: `[PAGEPORT] ${input.productTitle} 새 다운로드 주소입니다`,
    text: `새 다운로드 주소가 발급되었습니다.\n상품: ${input.productTitle}\n주문번호: ${input.orderId}\nPDF 다운로드: ${input.downloadUrl}\n\n이 주소는 24시간 또는 5회 다운로드까지 사용할 수 있습니다.`,
    html: await renderPageportEmail({
      preview: `${input.productTitle} 새 다운로드 주소`,
      eyebrow: "다운로드 주소 재발급",
      heading: "새 주소가 준비되었습니다.",
      lines: [title, `주문번호 ${orderId}`],
      buttonLabel: "PDF 다운로드",
      buttonUrl: url,
      note: "이 주소는 24시간 또는 5회 다운로드까지 사용할 수 있습니다.",
    }),
  };
}
