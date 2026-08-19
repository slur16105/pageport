function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

type PurchaseCompleteEmailInput = {
  productTitle: string;
  sellerName: string;
  orderId: string;
  amount: number;
  downloadUrl: string;
  recoveryUrl: string;
};

export function purchaseCompleteEmail(input: PurchaseCompleteEmailInput) {
  const productTitle = escapeHtml(input.productTitle);
  const sellerName = escapeHtml(input.sellerName);
  const orderId = escapeHtml(input.orderId);
  const amount = `${new Intl.NumberFormat("ko-KR").format(input.amount)}원`;
  const downloadUrl = escapeHtml(input.downloadUrl);
  const recoveryUrl = escapeHtml(input.recoveryUrl);

  return {
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
    html: `<!doctype html><html lang="ko"><body style="margin:0;background:#f6f1e7;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#17231d"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="background:#fffdf7;border:1px solid #17231d;padding:40px"><p style="margin:0 0 28px;font-weight:900;font-size:22px">PAGEPORT<span style="color:#ff5c35">.</span></p><p style="margin:0 0 10px;color:#496656;font-size:12px;font-weight:800;letter-spacing:.08em">구매 완료</p><h1 style="margin:0;font-size:28px;line-height:1.4">PDF가 준비되었습니다.</h1><div style="margin:28px 0;padding:20px;background:#e8dfd1;border:1px solid rgba(23,35,29,.16);font-size:14px;line-height:1.8"><strong>${productTitle}</strong><br>판매자 ${sellerName}<br>주문번호 ${orderId}<br>결제금액 ${amount}</div><a href="${downloadUrl}" style="display:block;padding:16px 20px;background:#ff5c35;color:#fff;text-decoration:none;text-align:center;font-weight:900">PDF 다운로드</a><p style="margin:22px 0 0;color:#5c6860;font-size:13px;line-height:1.7">이 주소는 발급 후 24시간 또는 5회 다운로드까지 사용할 수 있습니다.<br>주소가 만료되어도 구매 권리는 유지됩니다.</p><p style="margin:18px 0 0;font-size:12px"><a href="${recoveryUrl}" style="color:#17231d;font-weight:800">다운로드 주소 다시 받기</a></p></div><p style="margin:18px 0 0;color:#7a857f;font-size:11px;text-align:center">전문 지식이 오가는 디지털 문서 마켓 · PAGEPORT</p></div></body></html>`,
  };
}
