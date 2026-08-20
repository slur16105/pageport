import { expect, test } from "@playwright/test";

// 실제 운영 데이터를 저장하지 않고 관리자 상품 입력칸의 정확한 최대값과 모바일 레이아웃을 검사합니다.
test("상품 등록 최대값과 글자 수 안내가 PC와 모바일에서 유지된다", async ({ page }) => {
  await page.route("**/api/admin/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authenticated: true }),
    });
  });
  await page.route("**/api/admin/products", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [] }) });
  });

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "새 상품 등록" })).toBeVisible();

  await page.getByLabel("상품명").fill("상".repeat(80));
  await page.getByLabel("판매자명").fill("판".repeat(50));
  await page.getByLabel("카테고리").selectOption("업무·생산성");
  await page.getByLabel("판매가").fill("1000000");
  await page.getByLabel("PDF 쪽수").fill("10000");
  await page.getByLabel("표지 글자").fill("가나다라마바사아자차카타");
  await page.getByLabel("한 줄 소개").fill("소".repeat(160));
  await page.getByLabel("상세 설명").fill("설".repeat(2000));
  await page.getByLabel("상품 구성 · 한 줄에 하나").fill(Array.from({ length: 20 }, () => "구".repeat(100)).join("\n"));

  await expect(page.getByText("80 / 80자", { exact: true })).toBeVisible();
  await expect(page.getByText("160 / 160자", { exact: true })).toBeVisible();
  await expect(page.getByText("2,000 / 2,000자", { exact: true })).toBeVisible();
  await expect(page.getByText("20 / 20개 · 항목당 최대 100자", { exact: true })).toBeVisible();
  await expect(page.getByText(/입력 금액: 1,000,000원/)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
