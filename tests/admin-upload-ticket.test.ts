import { beforeEach, describe, expect, it, vi } from "vitest";

// Supabase와 데이터베이스를 실제로 호출하지 않고 업로드 전용 서명 발급 흐름을 검사합니다.
const mocks = vi.hoisted(() => ({
  isAdminRequest: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  uploadTicketCreate: vi.fn(),
}));

vi.mock("../lib/admin-auth", () => ({ isAdminRequest: mocks.isAdminRequest }));
vi.mock("../lib/env", () => ({
  env: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" }),
}));
vi.mock("../lib/prisma", () => ({
  prisma: { uploadTicket: { create: mocks.uploadTicketCreate } },
}));
vi.mock("../lib/supabase", () => ({
  PRIVATE_PDF_BUCKET: "product-pdfs",
  supabaseAdmin: () => ({
    storage: {
      from: () => ({ createSignedUploadUrl: mocks.createSignedUploadUrl }),
    },
  }),
}));

import { POST } from "../app/api/admin/uploads/ticket/route";

function ticketRequest() {
  return new Request("https://pageport.example/api/admin/uploads/ticket", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName: "sample.pdf", fileSize: 1024, contentType: "application/pdf" }),
  });
}

describe("관리자 PDF 업로드 권한", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdminRequest.mockResolvedValue(true);
    mocks.createSignedUploadUrl.mockResolvedValue({ data: { token: "signed-upload-token" }, error: null });
    mocks.uploadTicketCreate.mockResolvedValue({});
  });

  it("공개 키 대신 파일 전용 서명을 브라우저에 전달한다", async () => {
    const response = await POST(ticketRequest());
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.signature).toBe("signed-upload-token");
    expect(body.authorization).toBeUndefined();
    expect(mocks.createSignedUploadUrl).toHaveBeenCalledWith(expect.stringMatching(/^incoming\/.+\.pdf$/), {
      upsert: true,
    });
    expect(mocks.uploadTicketCreate).toHaveBeenCalledOnce();
  });

  it("서명 발급이 실패하면 사용할 수 없는 업로드 장부를 만들지 않는다", async () => {
    mocks.createSignedUploadUrl.mockResolvedValue({ data: null, error: { message: "signing failed" } });

    const response = await POST(ticketRequest());

    expect(response.status).toBe(500);
    expect(mocks.uploadTicketCreate).not.toHaveBeenCalled();
  });
});
