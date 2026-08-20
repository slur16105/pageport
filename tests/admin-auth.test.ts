import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/env", () => ({
  env: () => ({
    ADMIN_EMAIL: "owner@example.com",
    ADMIN_EMAILS: " tester@example.com, OWNER@example.com ",
    ADMIN_SESSION_SECRET: "test-admin-session-secret-at-least-32-bytes",
  }),
}));

import { createAdminSession, getAdminEmails, isAdminEmail, verifyAdminSession } from "../lib/admin-auth";

describe("여러 관리자 이메일 인증", () => {
  it("기본 관리자와 추가 관리자를 모두 허용하고 중복을 제거한다", () => {
    expect(getAdminEmails()).toEqual(["owner@example.com", "tester@example.com"]);
    expect(isAdminEmail("TESTER@example.com")).toBe(true);
    expect(isAdminEmail("unknown@example.com")).toBe(false);
  });

  it("추가 관리자도 자기 이메일로 유효한 세션을 만든다", async () => {
    const session = await createAdminSession("tester@example.com");
    await expect(verifyAdminSession(session.token)).resolves.toBe(true);
    await expect(createAdminSession("unknown@example.com")).rejects.toThrow("등록되지 않은 관리자 이메일");
  });
});
