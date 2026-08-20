import { beforeEach, describe, expect, it, vi } from "vitest";

// 실제 데이터베이스에 손대지 않고 다운로드 주소 생성 규칙만 시험하기 위한 가짜 저장소입니다.
const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock("../lib/env", () => ({ env: () => ({ DOWNLOAD_LINK_SECRET: "test-download-secret-at-least-32-bytes" }) }));
vi.mock("../lib/prisma", () => ({
  prisma: {
    downloadGrant: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      create: mocks.create,
    },
  },
}));

import { getOrCreatePurchaseDownloadGrant } from "../lib/download-links";

// 결제 완료 요청이 중복으로 도착해도 다운로드 주소가 여러 개 생기지 않는지 확인합니다.
describe("구매 다운로드 주소 멱등성", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T00:00:00Z"));
  });

  it("결제 확인을 다시 호출해도 같은 활성 주소를 돌려준다", async () => {
    mocks.findUnique.mockResolvedValue({
      revokedAt: null,
      expiresAt: new Date("2026-08-21T00:00:00Z"),
      downloadCount: 0,
      maxDownloads: 5,
    });

    const first = await getOrCreatePurchaseDownloadGrant("PP-TEST-1", "planner");
    const second = await getOrCreatePurchaseDownloadGrant("PP-TEST-1", "planner");

    expect(second).toEqual(first);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("재발급된 임의 주소가 있으면 결제 확인으로 교체하지 않는다", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.findFirst.mockResolvedValue({ id: "random-reissued-grant" });

    await expect(getOrCreatePurchaseDownloadGrant("PP-TEST-2", "planner")).resolves.toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("최초 결제에는 한 번만 구매 주소를 만든다", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "created" });

    const grant = await getOrCreatePurchaseDownloadGrant("PP-TEST-3", "planner");

    expect(grant?.token).toEqual(expect.any(String));
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});
