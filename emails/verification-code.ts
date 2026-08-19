function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

export function verificationCodeEmail(code: string, purpose: "checkout" | "redownload" | "admin" = "checkout") {
  const safeCode = escapeHtml(code);
  const isRedownload = purpose === "redownload";
  const isAdmin = purpose === "admin";
  const heading = isAdmin ? "관리자 화면에 들어가려면<br>인증번호를 입력해 주세요." : isRedownload ? "새 다운로드 주소를 받으려면<br>인증번호를 입력해 주세요." : "구매를 계속하려면<br>인증번호를 입력해 주세요.";
  const purposeLabel = isAdmin ? "관리자 로그인" : isRedownload ? "다운로드 주소 재발급" : "이메일";
  return {
    subject: `[PAGEPORT] ${purposeLabel} 인증번호 ${safeCode}`,
    text: `PAGEPORT ${purposeLabel} 인증번호는 ${safeCode}입니다. 10분 안에 입력해 주세요. 본인이 요청하지 않았다면 이 이메일을 무시해 주세요.`,
    html: `<!doctype html><html lang="ko"><body style="margin:0;background:#f6f1e7;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#17231d"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="background:#fffdf7;border:1px solid #17231d;padding:40px"><p style="margin:0 0 28px;font-weight:900;font-size:22px">PAGEPORT<span style="color:#ff5c35">.</span></p><p style="margin:0 0 10px;color:#496656;font-size:12px;font-weight:800;letter-spacing:.08em">이메일 확인</p><h1 style="margin:0;font-size:30px;line-height:1.3">${heading}</h1><div style="margin:30px 0;padding:22px;background:#e8dfd1;border:1px solid rgba(23,35,29,.16);font-size:34px;font-weight:900;letter-spacing:8px;text-align:center">${safeCode}</div><p style="margin:0;color:#5c6860;font-size:14px;line-height:1.7">인증번호는 10분 동안 사용할 수 있습니다.<br>본인이 요청하지 않았다면 이 이메일을 무시해 주세요.</p></div><p style="margin:18px 0 0;color:#7a857f;font-size:11px;text-align:center">전문 지식이 오가는 디지털 문서 마켓 · PAGEPORT</p></div></body></html>`,
  };
}
