function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

type RefundCompleteEmailInput = {
  productTitle: string;
  orderId: string;
  amount: number;
  reason: string;
  refundedAt: string;
  isTest: boolean;
};

export function refundCompleteEmail(input: RefundCompleteEmailInput) {
  const productTitle = escapeHtml(input.productTitle);
  const orderId = escapeHtml(input.orderId);
  const reason = escapeHtml(input.reason);
  const amount = `${new Intl.NumberFormat("ko-KR").format(input.amount)}원`;
  const refundedAt = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(input.refundedAt));
  const testNotice = input.isTest ? "시험 결제 환불이므로 실제 금액은 움직이지 않습니다." : "결제수단에 따라 환불 반영까지 시간이 걸릴 수 있습니다.";

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
    html: `<!doctype html><html lang="ko"><body style="margin:0;background:#f6f1e7;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#17231d"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="background:#fffdf7;border:1px solid #17231d;padding:40px"><p style="margin:0 0 28px;font-weight:900;font-size:22px">PAGEPORT<span style="color:#ff5c35">.</span></p><p style="margin:0 0 10px;color:#9c3429;font-size:12px;font-weight:800;letter-spacing:.08em">환불 완료</p><h1 style="margin:0;font-size:28px;line-height:1.4">환불 처리가 완료되었습니다.</h1><div style="margin:28px 0;padding:20px;background:#e8dfd1;border:1px solid rgba(23,35,29,.16);font-size:14px;line-height:1.8"><strong>${productTitle}</strong><br>주문번호 ${orderId}<br>환불금액 ${amount}<br>환불사유 ${reason}<br>처리일 ${refundedAt}</div><p style="margin:0;color:#5c6860;font-size:13px;line-height:1.7">환불된 주문의 다운로드 주소는 더 이상 사용할 수 없습니다.<br>${testNotice}</p></div><p style="margin:18px 0 0;color:#7a857f;font-size:11px;text-align:center">전문 지식이 오가는 디지털 문서 마켓 · PAGEPORT</p></div></body></html>`,
  };
}
