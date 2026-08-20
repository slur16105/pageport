// PDF 업로드 기술 오류가 관리자에게 쉬운 안내로 바뀌는지 확인합니다.
import { describe, expect, it } from "vitest";
import { explainAdminUploadError } from "../lib/admin-upload-errors";

describe("관리자 PDF 업로드 오류 안내", () => {
  it("잘못된 인증값을 쉬운 저장소 연결 안내로 바꾼다", () => {
    const issue = explainAdminUploadError(new Error("Invalid Compact JWS"));

    expect(issue.title).toContain("저장소 연결");
    expect(issue.description).toContain("PDF의 문제는 아닙니다");
    expect(issue.action).toContain("새로고침");
  });

  it("TUS 기술 오류 원문을 화면 안내에 포함하지 않는다", () => {
    const issue = explainAdminUploadError(new Error("tus: unexpected response while creating upload"));
    const visibleMessage = `${issue.title} ${issue.description} ${issue.action}`;

    expect(visibleMessage).not.toMatch(/tus|response|request|JWS/i);
  });

  it("저장소 권한 거절도 쉬운 다음 단계로 바꾼다", () => {
    const issue = explainAdminUploadError(new Error("AccessDenied: Unauthorized"));

    expect(issue.title).toContain("업로드 권한");
    expect(issue.action).toContain("운영 설정 담당자");
  });
});
