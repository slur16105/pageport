import { beforeEach, describe, expect, it, vi } from "vitest";

// 구매내역 다시 받기 인증번호가 실제 구매자에게만 발송되는지 서버 흐름만 분리해 검사합니다.
const mocks = vi.hoisted(() => ({
  purchaseFind: vi.fn(),
  verificationFind: vi.fn(),
  verificationUpsert: vi.fn(),
  allowRequest: vi.fn(),
  verifyTurnstile: vi.fn(),
}));

vi.mock("../lib/env", () => ({
  env: () => ({ RESEND_API_KEY: "test-resend-key", RESEND_FROM_EMAIL: "PAGEPORT <hello@example.com>" }),
}));
vi.mock("../lib/admin-auth", () => ({ isAdminEmail: () => false }));
vi.mock("../lib/email-verification", () => ({ hashVerificationValue: (value: string) => `hash:${value}` }));
vi.mock("../lib/request-security", () => ({
  allowRequest: mocks.allowRequest,
  privacyHash: (value: string) => `private:${value}`,
  requestIp: () => "127.0.0.1",
  verifyTurnstile: mocks.verifyTurnstile,
}));
vi.mock("../lib/prisma", () => ({
  prisma: {
    order: { findFirst: mocks.purchaseFind },
    emailVerification: { findUnique: mocks.verificationFind, upsert: mocks.verificationUpsert },
  },
}));
vi.mock("../emails/verification-code", () => ({
  verificationCodeEmail: () => ({ subject: "인증번호", text: "시험", html: "<p>시험</p>" }),
}));

import { POST } from "../app/api/email/send-code/route";

function redownloadRequest(email: string) {
  return new Request("https://pageport.example/api/email/send-code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, purpose: "redownload" }),
  });
}

describe("재다운로드 인증번호 발송", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.allowRequest.mockResolvedValue(true);
    mocks.verifyTurnstile.mockResolvedValue(true);
    mocks.verificationFind.mockResolvedValue(null);
    mocks.verificationUpsert.mockResolvedValue({});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: "email-1" })));
  });

  it("결제 완료 내역이 없으면 성공 안내만 반환하고 이메일을 보내지 않는다", async () => {
    mocks.purchaseFind.mockResolvedValue(null);

    const response = await POST(redownloadRequest("visitor@example.com"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ sent: true });
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.verificationUpsert).not.toHaveBeenCalled();
  });

  it("결제 완료 내역이 있으면 인증번호 이메일과 확인 기록을 만든다", async () => {
    mocks.purchaseFind.mockResolvedValue({ id: "PP-PAID" });

    const response = await POST(redownloadRequest("buyer@example.com"));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.verificationUpsert).toHaveBeenCalledTimes(1);
  });
});
