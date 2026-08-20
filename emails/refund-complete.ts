// 환불이 처리된 뒤 고객에게 금액, 사유, 처리일과 다운로드 중단 사실을 알려주는 이메일입니다.
// 이메일 본문에 들어갈 외부 문구를 안전한 글자로 바꿉니다.
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

type RefundCompleteEmailInput = {
  productTitle: string;
  orderId: string;
  amount: number;
  reason: string;
  refundedAt: string;
  isTest: boolean;
};

export async function refundCompleteEmail(input: RefundCompleteEmailInput) {
  // 시험 환불과 실제 환불은 고객이 오해하지 않도록 서로 다른 안내문을 사용합니다.
  const productTitle = escapeHtml(input.productTitle);
  const orderId = escapeHtml(input.orderId);
  const reason = escapeHtml(input.reason);
  const amount = `${new Intl.NumberFormat("ko-KR").format(input.amount)}원`;
  const refundedAt = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(input.refundedAt),
  );
  const testNotice = input.isTest
    ? "시험 결제 환불이므로 실제 금액은 움직이지 않습니다."
    : "결제수단에 따라 환불 반영까지 시간이 걸릴 수 있습니다.";

  return {
    subject: `[PAGEPORT] ${input.productTitle} 환불이 완료되었습니다`,
    text: [
      "PAGEPORT 환불이 완료되었습니다.",
      `상품: ${input.productTitle}`,
      `주문번호: ${input.orderId}`,
      `환불금액: ${amount}`,
      `환불사유: ${input.reason}`,
      `환불처리일: ${refundedAt}`,
      "",
      "환불된 주문의 다운로드 주소는 더 이상 사용할 수 없습니다.",
      testNotice,
    ].join("\n"),
    html: await renderPageportEmail({
      preview: `${input.productTitle} 환불이 완료되었습니다`,
      eyebrow: "환불 완료",
      heading: "환불 처리가 완료되었습니다.",
      lines: [productTitle, `주문번호 ${orderId}`, `환불금액 ${amount}`, `환불사유 ${reason}`, `처리일 ${refundedAt}`],
      note: `환불된 주문의 다운로드 주소는 더 이상 사용할 수 없습니다. ${testNotice}`,
    }),
  };
}
// 모든 PAGEPORT 이메일이 같은 디자인을 사용하도록 공통 틀을 불러옵니다.
import { renderPageportEmail } from "./render";
