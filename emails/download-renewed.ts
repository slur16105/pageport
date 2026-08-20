// 구매자가 만료된 다운로드 주소를 다시 발급받았을 때 보내는 이메일 내용을 만듭니다.
import { renderPageportEmail } from "./render";

// 상품명처럼 외부에서 들어온 글자가 이메일 화면의 코드로 오해되지 않도록 안전하게 바꿉니다.
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
  // 일반 텍스트 메일과 디자인이 적용된 HTML 메일을 함께 준비해 어떤 메일 앱에서도 읽을 수 있게 합니다.
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
