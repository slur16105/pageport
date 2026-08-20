import { expect, test } from "@playwright/test";

test("홈에서 상품 상세와 구매 화면으로 이동한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /전문 지식이/ })).toBeVisible();
  await page.getByRole("link", { name: /한 장으로 끝내는 주간 업무 플래너/ }).click();
  await expect(page).toHaveURL(/\/products\/weekly-work-planner/);
  await expect(page.getByRole("heading", { name: "한 장으로 끝내는 주간 업무 플래너" })).toBeVisible();
  const buyButton = page.getByRole("button", { name: "주문 확인으로 이동" });
  await expect(buyButton).toBeEnabled();
  const email = page.getByRole("textbox", { name: "구매 이메일" });
  await email.fill("buyer@gmail.com");
  await expect(email).toHaveValue("buyer@gmail.com");
  await buyButton.click();
  await expect(page).toHaveURL(/\/checkout\/weekly-work-planner/);
});

test("구매 파일 다시 받기와 관리자 로그인 화면이 열린다", async ({ page }) => {
  await page.goto("/downloads/reissue");
  await expect(page).toHaveURL(/\/downloads\/reissue/);
  await expect(page.getByRole("heading", { name: /다시/ })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
});
