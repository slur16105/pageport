import { renderPageportEmail } from "./render";

export async function verificationCodeEmail(code: string, purpose: "checkout" | "redownload" | "admin" = "checkout") {
  const isRedownload = purpose === "redownload";
  const isAdmin = purpose === "admin";
  const heading = isAdmin
    ? "관리자 화면 인증번호입니다."
    : isRedownload
      ? "새 다운로드 주소 인증번호입니다."
      : "구매를 계속할 인증번호입니다.";
  const purposeLabel = isAdmin ? "관리자 로그인" : isRedownload ? "다운로드 주소 재발급" : "이메일";
  return {
    subject: `[PAGEPORT] ${purposeLabel} 인증번호 ${code}`,
    text: `PAGEPORT ${purposeLabel} 인증번호는 ${code}입니다. 10분 안에 입력해 주세요.`,
    html: await renderPageportEmail({
      preview: `PAGEPORT 인증번호 ${code}`,
      eyebrow: "이메일 확인",
      heading,
      lines: [`인증번호: ${code}`],
      note: "인증번호는 10분 동안 사용할 수 있습니다. 본인이 요청하지 않았다면 이 이메일을 무시해 주세요.",
    }),
  };
}
