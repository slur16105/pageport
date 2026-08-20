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

  // 가입 화면이 없는 서비스에 맞는 질문과 구매내역 확인 안내가 노출되어야 합니다.
  await expect(page.getByText("회원가입 없이 어떻게 이용하나요?", { exact: true })).toBeVisible();
  await expect(page.getByText("구매내역은 어떻게 확인하나요?", { exact: true })).toBeVisible();
  await expect(page.getByText("다운로드 주소가 만료되면 다시 결제해야 하나요?", { exact: true })).toBeVisible();

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

  // 공통 컴포넌트를 사용한 헤더·푸터의 배경색이 메인 화면과 실제로 같은지도 비교합니다.
  const accessHeaderColor = await page
    .getByRole("banner")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const accessFooterColor = await page
    .getByRole("contentinfo")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.goto("/");
  await expect
    .poll(() => page.getByRole("banner").evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(accessHeaderColor);
  await expect
    .poll(() => page.getByRole("contentinfo").evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(accessFooterColor);

  await page.goto("/access/unavailable?reason=session-expired");
  await expect(page.getByRole("heading", { name: "인증 시간이 지나 다시 확인이 필요해요." })).toBeVisible();
  await expect(page.getByRole("link", { name: "다시 인증하기" })).toHaveAttribute("href", "/downloads/reissue");
});

test("서비스 소개에서 구매자와 관리자 흐름으로 이동할 수 있다", async ({ page }) => {
  // 소개 화면은 일반 구매 메뉴에 노출하지 않지만, 검토자가 주소로 직접 열면 구매자·관리자 흐름을 확인할 수 있습니다.
  await page.goto("/about");
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByText(/일반 구매자 화면이 아닙니다/)).toBeVisible();
  await expect(page.getByText(/서비스 확인을 위한 안내서입니다/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "검토 대상 화면" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "주요 메뉴" })).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { name: /계정은 가볍게/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "구매와 운영은 이렇게 이어집니다." })).toBeVisible();
  await expect(page.getByRole("link", { name: "PDF 상품 보기" })).toHaveAttribute("href", "/#products");
  await expect(page.getByRole("link", { name: "구매 파일 다시 받기", exact: true }).last()).toHaveAttribute(
    "href",
    "/downloads/reissue",
  );
  await expect(page.getByRole("link", { name: "관리자 화면 열기" })).toHaveAttribute("href", "/admin");
});

test("모바일에서도 메뉴와 상품 3열이 유지된다", async ({ page }, testInfo) => {
  // 휴대전화 전용 프로젝트에서만 실행해, 메뉴가 사라지거나 상품이 한 줄로 늘어지는 회귀를 막습니다.
  test.skip(testInfo.project.name !== "mobile-webkit", "모바일 화면 전용 확인입니다.");
  await page.goto("/");

  await expect(page.getByRole("navigation", { name: "주요 메뉴" })).toBeVisible();
  await expect(page.getByRole("link", { name: "구매한 PDF 파일 다시 받기" })).toBeVisible();
  await expect(page.getByRole("link", { name: "PAGEPORT 소개" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "서비스 소개" })).toHaveCount(0);

  const columnCount = await page
    .locator(".product-grid")
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(columnCount).toBe(3);
});
