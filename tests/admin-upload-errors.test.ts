// 관리자에게 PDF 업로드 오류의 원인과 해결 방법이 쉬운 문장으로 전달되는지 확인합니다.
import { describe, expect, it } from "vitest";
import { explainAdminUploadError } from "../lib/admin-upload-errors";

describe("관리자 PDF 업로드 오류 안내", () => {
  it("잘못된 TUS 인증값을 환경변수 조치 안내로 바꾼다", () => {
    const issue = explainAdminUploadError(new Error("Invalid Compact JWS"));

    expect(issue.title).toContain("인증 설정");
    expect(issue.description).toContain("PDF 파일의 문제가 아닙니다");
    expect(issue.action).toContain("SUPABASE_TUS_ANON_KEY");
    expect(issue.action).toContain("재배포");
  });

  it("원문 기술 오류를 그대로 노출하지 않는다", () => {
    const issue = explainAdminUploadError(new Error("tus: unexpected response while creating upload"));

    expect(`${issue.title} ${issue.description} ${issue.action}`).not.toContain("tus: unexpected");
  });

  it("저장소 보안정책 거절에는 SQL 변경 확인 방법을 안내한다", () => {
    const issue = explainAdminUploadError(new Error("AccessDenied: Unauthorized"));

    expect(issue.title).toContain("업로드 허용 규칙");
    expect(issue.action).toContain("SQL Migration");
  });
});
