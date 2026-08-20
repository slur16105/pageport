// 결제가 끝난 고객에게 영수증 정보, PDF 다운로드 주소, 다시 받기 주소를 안내합니다.
import { renderPageportEmail } from "./render";

// 고객이나 운영자가 입력한 문구 때문에 이메일 디자인 코드가 망가지지 않도록 보호합니다.
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

type PurchaseCompleteEmailInput = {
  productTitle: string;
  sellerName: string;
  orderId: string;
  amount: number;
  downloadUrl: string;
  recoveryUrl: string;
};

export async function purchaseCompleteEmail(input: PurchaseCompleteEmailInput) {
  // 화면에 넣을 값은 안전하게 바꾸고, 금액은 한국식 원화 표기로 정리합니다.
  const productTitle = escapeHtml(input.productTitle);
  const sellerName = escapeHtml(input.sellerName);
  const orderId = escapeHtml(input.orderId);
  const amount = `${new Intl.NumberFormat("ko-KR").format(input.amount)}원`;
  const downloadUrl = escapeHtml(input.downloadUrl);
  const recoveryUrl = escapeHtml(input.recoveryUrl);

  return {
    // text는 단순 메일용이고 html은 PAGEPORT 디자인이 적용된 메일용입니다.
    subject: `[PAGEPORT] ${input.productTitle} 구매가 완료되었습니다`,
    text: [
      "PAGEPORT 구매가 완료되었습니다.",
      `상품: ${input.productTitle}`,
      `판매자: ${input.sellerName}`,
      `주문번호: ${input.orderId}`,
      `결제금액: ${amount}`,
      "",
      `PDF 다운로드: ${input.downloadUrl}`,
      "다운로드 주소는 발급 후 24시간 또는 5회 다운로드까지 사용할 수 있습니다.",
      "주소가 만료되어도 구매 권리는 유지되며, 구매 이메일 인증 후 새 주소를 받을 수 있습니다.",
      `다운로드 주소 다시 받기: ${input.recoveryUrl}`,
    ].join("\n"),
    html: await renderPageportEmail({
      preview: `${input.productTitle} 구매가 완료되었습니다`,
      eyebrow: "구매 완료",
      heading: "PDF가 준비되었습니다.",
      lines: [productTitle, `판매자 ${sellerName}`, `주문번호 ${orderId}`, `결제금액 ${amount}`],
      buttonLabel: "PDF 다운로드",
      buttonUrl: downloadUrl,
      note: `이 주소는 24시간 또는 5회까지 사용할 수 있습니다. 만료되면 ${recoveryUrl} 에서 다시 받을 수 있습니다.`,
    }),
  };
}
