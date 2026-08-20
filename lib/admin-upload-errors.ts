// PDF 업로드가 실패했을 때 기술 오류를 관리자용 원인·조치 안내로 바꿉니다.

export type AdminUploadIssue = {
  title: string;
  description: string;
  action: string;
};

export function explainAdminUploadError(error: unknown): AdminUploadIssue {
  const message = error instanceof Error ? error.message : String(error);

  if (/Invalid Compact JWS|TUS_UPLOAD_AUTH_INVALID/i.test(message)) {
    return {
      title: "PDF 저장소 인증 설정을 확인해 주세요.",
      description:
        "상품 내용이나 PDF 파일의 문제가 아닙니다. Supabase가 현재 업로드 허가값을 올바른 JWT 형식으로 읽지 못해 파일 저장을 거절했습니다.",
      action:
        "입력값을 먼저 복사해 둔 다음, Vercel 환경변수 SUPABASE_TUS_ANON_KEY에 Supabase의 Legacy anon 키(eyJ로 시작하는 JWT)를 저장하고 재배포해 주세요. 새 배포가 끝나면 관리자 화면을 다시 열어 저장합니다.",
    };
  }

  if (/AccessDenied|Unauthorized|row-level security|policy/i.test(message)) {
    return {
      title: "PDF 저장소의 업로드 허용 규칙을 확인해 주세요.",
      description:
        "인증값은 전달됐지만 Supabase의 보안정책이 이번 PDF의 임시 저장 위치를 허용하지 않았습니다. 상품 내용이나 PDF 파일의 문제는 아닙니다.",
      action:
        "Supabase 데이터베이스에 최신 SQL Migration이 적용됐는지 확인한 뒤 다시 저장해 주세요. 최신 변경 파일은 20260820153000_fix_tus_ticket_rls입니다.",
    };
  }

  if (/25MB|413|too large|maximum allowed size|payload too large/i.test(message)) {
    return {
      title: "PDF 파일 용량을 확인해 주세요.",
      description: "등록할 수 있는 PDF는 25MB 이하입니다.",
      action: "PDF 용량을 25MB 이하로 줄이거나 다른 파일을 선택한 뒤 다시 저장해 주세요.",
    };
  }

  if (/network|failed to fetch|offline|timeout|timed out/i.test(message)) {
    return {
      title: "PDF 업로드 중 인터넷 연결이 끊겼습니다.",
      description: "상품 정보는 아직 저장되지 않았으며 입력한 내용은 화면에 남아 있습니다.",
      action: "인터넷 연결을 확인한 뒤 같은 파일로 상품 저장 버튼을 다시 눌러 주세요.",
    };
  }

  if (/ticket|권한이 만료|expired/i.test(message)) {
    return {
      title: "PDF 업로드 시간이 만료되었습니다.",
      description: "안전을 위해 업로드 허가는 30분 동안만 사용할 수 있습니다.",
      action: "PDF 파일을 다시 선택한 뒤 상품 저장 버튼을 눌러 새 업로드 허가를 받아 주세요.",
    };
  }

  return {
    title: "상품을 저장하지 못했습니다.",
    description: "입력한 상품 정보는 화면에 남아 있습니다.",
    action:
      "잠시 후 상품 저장을 다시 눌러 주세요. 계속 실패하면 관리자에게 Supabase Storage 설정과 배포 로그 확인을 요청해 주세요.",
  };
}
