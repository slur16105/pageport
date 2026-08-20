import { beforeEach, describe, expect, it, vi } from "vitest";

// Supabase와 데이터베이스를 실제로 호출하지 않고 TUS용 JWT와 일회용 업로드 허가 흐름을 검사합니다.
const mocks = vi.hoisted(() => ({
  isAdminRequest: vi.fn(),
  uploadTicketCreate: vi.fn(),
  envConfig: {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_TUS_ANON_KEY: "header.payload.signature" as string | undefined,
  },
}));

vi.mock("../lib/admin-auth", () => ({ isAdminRequest: mocks.isAdminRequest }));
vi.mock("../lib/env", () => ({
  env: () => mocks.envConfig,
}));
vi.mock("../lib/prisma", () => ({
  prisma: { uploadTicket: { create: mocks.uploadTicketCreate } },
}));
vi.mock("../lib/supabase", () => ({
  PRIVATE_PDF_BUCKET: "product-pdfs",
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
    mocks.uploadTicketCreate.mockResolvedValue({});
    mocks.envConfig.SUPABASE_TUS_ANON_KEY = "header.payload.signature";
  });

  it("TUS Bearer용 anon JWT와 Storage 직결 주소를 브라우저에 전달한다", async () => {
    const response = await POST(ticketRequest());
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.authorization).toBe("header.payload.signature");
    expect(body.endpoint).toBe("https://project.storage.supabase.co/storage/v1/upload/resumable");
    expect(body.signature).toBeUndefined();
    expect(mocks.uploadTicketCreate).toHaveBeenCalledOnce();
  });

  it("TUS용 JWT가 없으면 업로드 장부를 만들지 않고 쉬운 오류 코드를 보낸다", async () => {
    mocks.envConfig.SUPABASE_TUS_ANON_KEY = undefined;

    const response = await POST(ticketRequest());
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(503);
    expect(body.code).toBe("TUS_UPLOAD_AUTH_INVALID");
    expect(mocks.uploadTicketCreate).not.toHaveBeenCalled();
  });
});
