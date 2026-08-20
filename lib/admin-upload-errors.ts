// PDF 업로드의 기술 오류를 화면에 그대로 노출하지 않고, 운영자가 이해할 수 있는 안내로 바꿉니다.

export type AdminUploadIssue = {
  title: string;
  description: string;
  action: string;
};

export function explainAdminUploadError(error: unknown): AdminUploadIssue {
  const message = error instanceof Error ? error.message : String(error);

  if (/Invalid Compact JWS|TUS_UPLOAD_AUTH_INVALID/i.test(message)) {
    return {
      title: "PDF 저장소 연결을 확인해 주세요.",
      description: "상품 내용이나 선택한 PDF의 문제는 아닙니다. 현재 파일 저장 연결이 올바르게 인증되지 않았습니다.",
      action: "최신 배포가 완료됐는지 확인한 뒤 관리자 화면을 새로고침하고 다시 저장해 주세요.",
    };
  }

  if (/AccessDenied|Unauthorized|row-level security|policy/i.test(message)) {
    return {
      title: "PDF 업로드 권한을 확인해 주세요.",
      description: "파일 저장소가 이번 업로드 요청을 허용하지 않았습니다. 입력한 상품 정보는 화면에 남아 있습니다.",
      action: "잠시 후 다시 저장해 주세요. 계속 실패하면 사이트 운영 설정 담당자에게 확인을 요청해 주세요.",
    };
  }

  if (/25MB|413|too large|maximum allowed size|payload too large/i.test(message)) {
    return {
      title: "PDF 파일 용량을 확인해 주세요.",
      description: "등록할 수 있는 PDF는 25MB 이하입니다.",
      action: "PDF 용량을 줄이거나 다른 파일을 선택한 뒤 다시 저장해 주세요.",
    };
  }

  if (/network|failed to fetch|offline|timeout|timed out/i.test(message)) {
    return {
      title: "PDF 업로드 중 연결이 끊겼습니다.",
      description: "상품 정보는 아직 저장되지 않았으며 입력한 내용은 화면에 남아 있습니다.",
      action: "인터넷 연결을 확인한 뒤 같은 파일로 상품 저장 버튼을 다시 눌러 주세요.",
    };
  }

  if (/ticket|권한이 만료|expired/i.test(message)) {
    return {
      title: "PDF 업로드 시간이 만료되었습니다.",
      description: "안전을 위해 업로드 허가는 30분 동안만 사용할 수 있습니다.",
      action: "PDF 파일을 다시 선택한 뒤 상품 저장 버튼을 눌러 주세요.",
    };
  }

  return {
    title: "상품을 저장하지 못했습니다.",
    description: "입력한 상품 정보는 화면에 남아 있습니다.",
    action: "잠시 후 다시 저장해 주세요. 같은 문제가 계속되면 사이트 운영 설정 담당자에게 확인을 요청해 주세요.",
  };
}
