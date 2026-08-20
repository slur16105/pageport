import { expect, test } from "@playwright/test";

// 이 파일은 실제 브라우저를 움직여 고객의 주요 이용 흐름이 처음부터 끝까지 연결되는지 확인합니다.
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
  // 로그인이 없는 구매자용 재발급 화면과 운영자 전용 입구를 차례로 확인합니다.
  await page.goto("/downloads/reissue");
  await expect(page).toHaveURL(/\/downloads\/reissue/);
  await expect(page.getByRole("heading", { name: /다시/ })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
});

test("상품 카테고리 필터와 정책 페이지의 공통 메뉴가 동작한다", async ({ page }) => {
  // 필터 기능과 헤더·푸터가 정책 페이지에서도 끊기지 않는지 확인합니다.
  await page.goto("/");
  await page.getByRole("button", { name: "업무·생산성" }).click();
  await expect(page.getByRole("button", { name: "업무·생산성" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".product-card")).toHaveCount(2);

  await page.getByRole("link", { name: "이용약관" }).click();
  await expect(page).toHaveURL(/\/terms/);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: "페이지포트 홈" }).first()).toBeVisible();
});

test("히어로 문서가 등장하고 마우스에 가볍게 반응한다", async ({ page }) => {
  // 첫 화면 장식이 보이며, 마우스 위치에 따라 움직임 값이 바뀌는지 확인합니다.
  await page.goto("/");
  const art = page.locator(".hero-art");
  await expect(art).toBeVisible();
  const box = await art.boundingBox();
  if (!box) throw new Error("히어로 그래픽 영역을 찾을 수 없습니다.");

  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.35);
  await expect.poll(() => art.evaluate((element) => element.style.getPropertyValue("--hero-front-x"))).not.toBe("0px");
});

test("잘못된 주소에서도 공통 메뉴와 다음 행동을 안내한다", async ({ page }) => {
  // 고객이 잘못된 주소를 입력해도 막다른 화면이 아니라 상품 목록으로 돌아갈 수 있어야 합니다.
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "찾으시는 페이지가 없어요." })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: "상품 둘러보기" })).toHaveAttribute("href", "/#products");

  await page.goto("/access/unavailable?reason=session-expired");
  await expect(page.getByRole("heading", { name: "인증 시간이 지나 다시 확인이 필요해요." })).toBeVisible();
  await expect(page.getByRole("link", { name: "다시 인증하기" })).toHaveAttribute("href", "/downloads/reissue");
});
