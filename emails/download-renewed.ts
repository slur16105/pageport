function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

export function downloadRenewedEmail(input: { productTitle: string; orderId: string; downloadUrl: string }) {
  const title = escapeHtml(input.productTitle);
  const orderId = escapeHtml(input.orderId);
  const url = escapeHtml(input.downloadUrl);
  return {
    subject: `[PAGEPORT] ${input.productTitle} 새 다운로드 주소입니다`,
    text: `새 다운로드 주소가 발급되었습니다.\n상품: ${input.productTitle}\n주문번호: ${input.orderId}\nPDF 다운로드: ${input.downloadUrl}\n\n이 주소는 24시간 또는 5회 다운로드까지 사용할 수 있습니다.`,
    html: `<!doctype html><html lang="ko"><body style="margin:0;background:#f6f1e7;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#17231d"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="background:#fffdf7;border:1px solid #17231d;padding:40px"><p style="margin:0 0 28px;font-weight:900;font-size:22px">PAGEPORT<span style="color:#ff5c35">.</span></p><p style="margin:0 0 10px;color:#496656;font-size:12px;font-weight:800;letter-spacing:.08em">다운로드 주소 재발급</p><h1 style="margin:0;font-size:28px;line-height:1.4">새 주소가 준비되었습니다.</h1><p style="margin:22px 0;color:#5c6860;font-size:14px;line-height:1.7"><strong>${title}</strong><br>주문번호 ${orderId}</p><a href="${url}" style="display:block;padding:16px 20px;background:#ff5c35;color:#fff;text-decoration:none;text-align:center;font-weight:900">PDF 다운로드</a><p style="margin:22px 0 0;color:#5c6860;font-size:13px;line-height:1.7">이 주소는 24시간 또는 5회 다운로드까지 사용할 수 있습니다.</p></div><p style="margin:18px 0 0;color:#7a857f;font-size:11px;text-align:center">전문 지식이 오가는 디지털 문서 마켓 · PAGEPORT</p></div></body></html>`,
  };
}
