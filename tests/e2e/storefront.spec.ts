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

test("관리자 인증과 로그인 버튼 크기가 일관된다", async ({ page }) => {
  // 인증번호를 받은 뒤 나타나는 로그인 버튼도 첫 버튼과 같은 너비·높이를 유지해야 합니다.
  await page.route("**/api/admin/session", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"authenticated":false}' });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/email/send-code", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/admin");
  const verificationButton = page.getByRole("button", { name: "인증번호 받기" });
  await page.getByPlaceholder("name@example.com").fill("admin@example.com");
  const verificationBox = await verificationButton.boundingBox();
  if (!verificationBox) throw new Error("인증번호 받기 버튼의 크기를 확인할 수 없습니다.");
  await verificationButton.click();

  const loginButton = page.getByRole("button", { name: "로그인", exact: true });
  await expect(loginButton).toBeVisible();
  const loginBox = await loginButton.boundingBox();
  if (!loginBox) throw new Error("로그인 버튼의 크기를 확인할 수 없습니다.");
  expect(loginBox.width).toBe(verificationBox.width);
  expect(loginBox.height).toBe(verificationBox.height);
});

test("관리자 햄버거 버튼은 모바일에서만 보인다", async ({ page }, testInfo) => {
  await page.route("**/api/admin/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: true }) }),
  );
  await page.route("**/api/admin/products", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [] }) }),
  );
  await page.goto("/admin");

  const menuButton = page.getByRole("button", { name: "관리자 메뉴 열기" });
  if (testInfo.project.name === "mobile-webkit") {
    await expect(menuButton).toBeVisible();
    await expect(page.getByRole("navigation", { name: "관리자 메뉴" })).toBeHidden();
    await expect(page.locator(".admin-header-actions")).toBeHidden();
  } else {
    await expect(menuButton).toBeHidden();
    await expect(page.getByRole("navigation", { name: "관리자 메뉴" })).toBeVisible();
    await expect(page.getByRole("link", { name: "쇼핑몰로 이동" })).toBeVisible();
  }
});

test("구매 이메일과 인증번호 확인 버튼 크기가 일관된다", async ({ page }) => {
  // 결제 화면의 두 이메일 인증 단계가 문구 길이에 상관없이 같은 크기를 유지해야 합니다.
  await page.route("**/api/email/send-code", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto("/checkout/weekly-work-planner");

  const sendButton = page.getByRole("button", { name: "인증번호 받기" });
  await expect(sendButton).toBeEnabled();
  const emailInput = page.getByPlaceholder("name@example.com");
  await emailInput.fill("buyer@gmail.com");
  await expect(emailInput).toHaveValue("buyer@gmail.com");
  const sendBox = await sendButton.boundingBox();
  if (!sendBox) throw new Error("인증번호 받기 버튼의 크기를 확인할 수 없습니다.");
  await sendButton.click();

  const confirmButton = page.getByRole("button", { name: "확인", exact: true });
  await expect(confirmButton).toBeVisible();
  const confirmBox = await confirmButton.boundingBox();
  if (!confirmBox) throw new Error("인증번호 확인 버튼의 크기를 확인할 수 없습니다.");
  expect(confirmBox.width).toBe(sendBox.width);
  expect(confirmBox.height).toBe(sendBox.height);
  expect(confirmBox.height).toBe(50);
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
  await expect(page.getByRole("banner")).toHaveCSS("position", "sticky");

  const browseButton = page.locator(".hero-actions .primary-button");
  const trustRow = page.locator(".trust-row");
  // 두 요소의 등장 애니메이션 시작 시간이 달라 CI에서는 잠시 높이가 어긋날 수 있으므로 최종 위치를 기다립니다.
  await expect
    .poll(async () => {
      const browseButtonBox = await browseButton.boundingBox();
      const trustRowBox = await trustRow.boundingBox();
      if (!browseButtonBox || !trustRowBox) return Number.POSITIVE_INFINITY;
      return Math.abs(trustRowBox.y - browseButtonBox.y);
    })
    .toBeLessThan(2);
  const browseButtonBox = await browseButton.boundingBox();
  const trustRowBox = await trustRow.boundingBox();
  if (!browseButtonBox || !trustRowBox) throw new Error("모바일 히어로 안내 영역의 위치를 확인할 수 없습니다.");
  expect(trustRowBox.x).toBeGreaterThan(browseButtonBox.x + browseButtonBox.width);

  const columnCount = await page
    .locator(".product-grid")
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(columnCount).toBe(3);
});

test("상품 목록은 넓은 화면 4열에서 한 번만 3열로 바뀐다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "화면 너비 분기 확인은 한 브라우저에서만 실행합니다.");
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator(".product-grid")
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length),
    )
    .toBe(4);

  await page.setViewportSize({ width: 1000, height: 900 });
  await expect
    .poll(() =>
      page
        .locator(".product-grid")
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length),
    )
    .toBe(3);

  await page.setViewportSize({ width: 700, height: 900 });
  await expect
    .poll(() =>
      page
        .locator(".product-grid")
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length),
    )
    .toBe(3);
});

test("모바일 재다운로드와 상품 안내의 정렬이 자연스럽다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-webkit", "모바일 화면 전용 확인입니다.");
  await page.goto("/downloads/reissue");
  const headingLines = page.locator(".reissue-copy h1 span");
  await expect(headingLines).toHaveCount(2);
  await expect(headingLines.nth(0)).toHaveText("구매한 PDF를");
  await expect(headingLines.nth(1)).toHaveText("다시 받아보세요.");
  await expect(page.locator(".reissue-copy")).toHaveCSS("text-align", "center");

  await page.goto("/products/weekly-work-planner");
  const titleLeft = await page.locator(".policy-card h3").evaluate((element) => element.getBoundingClientRect().left);
  const bodyLeft = await page
    .locator(".policy-card li")
    .first()
    .evaluate((element) => element.getBoundingClientRect().left);
  expect(Math.abs(titleLeft - bodyLeft)).toBeLessThan(1);
});

test("관리자 모바일 화면은 넘치지 않고 메뉴와 쇼핑몰 링크를 유지한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-webkit", "관리자 모바일 화면 전용 확인입니다.");
  await page.route("**/api/admin/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: true }) }),
  );
  await page.route("**/api/admin/products", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        products: [
          {
            slug: "weekly-work-planner",
            category: "업무·생산성",
            title: "한 장으로 끝내는 주간 업무 플래너",
            sellerName: "PAGEPORT",
            description: "주간 업무 정리",
            amount: 4900,
            accent: "mint",
            mark: "WEEK",
            pages: 18,
            fileSize: "4.2MB",
            summary: "한 주를 정리합니다.",
            includes: ["주간 계획"],
            status: "published",
          },
        ],
      }),
    }),
  );
  await page.route("**/api/admin/orders", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        orders: [
          {
            orderId: "PP-MOBILE-QA",
            productTitle: "주간 업무 플래너",
            sellerName: "PAGEPORT",
            buyerEmail: "buyer@example.com",
            amount: 4900,
            currency: "KRW",
            status: "test_paid",
            isTest: true,
            approvedAt: "2026-08-20T05:00:00.000Z",
            createdAt: "2026-08-20T05:00:00.000Z",
            downloadCount: 1,
            lastDownloadedAt: null,
            refundedAt: null,
            refundReason: null,
            refundEmailSentAt: null,
          },
        ],
      }),
    }),
  );

  await page.goto("/admin");
  await expect(page.locator(".admin-header")).toHaveCSS("position", "sticky");
  await expect(page.locator(".admin-header")).toHaveCSS("height", "64px");
  await expect(page.locator(".admin-mobile-controls > span")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "관리자 메뉴 열기" })).toBeVisible();
  await page.getByRole("button", { name: "관리자 메뉴 열기" }).click();
  const mobileMenu = page.getByRole("navigation", { name: "모바일 관리자 메뉴" });
  await expect(mobileMenu).toBeVisible();
  await expect(page.getByText("관리 메뉴", { exact: true })).toBeVisible();
  await expect(page.getByText("기타 기능", { exact: true })).toBeVisible();
  await expect(mobileMenu.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "쇼핑몰로 이동" })).toBeVisible();
  await expect(page.locator(".admin-menu-logout").getByRole("button", { name: "로그아웃" })).toBeVisible();
  await expect(mobileMenu.getByRole("button", { name: "상품 관리" })).toHaveClass(/active/);
  const inputHeight = await page
    .locator(".admin-form input")
    .first()
    .evaluate((element) => element.getBoundingClientRect().height);
  const selectHeight = await page
    .locator(".admin-form select")
    .first()
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(inputHeight).toBe(selectHeight);
  const statusHeight = await page
    .locator(".admin-form select")
    .last()
    .evaluate((element) => element.getBoundingClientRect().height);
  const saveButtonHeight = await page
    .locator(".admin-save")
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(statusHeight).toBe(46);
  expect(saveButtonHeight).toBe(statusHeight);
  await expect(page.locator(".admin-product-mark")).toHaveCSS("background-color", "rgb(184, 212, 188)");
  await expect(page.locator(".admin-product-row > b")).toHaveCSS("font-size", "12px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await mobileMenu.getByRole("button", { name: "주문 관리" }).click();
  await expect(mobileMenu).not.toBeVisible();
  await expect(page.locator(".order-table td").first()).toHaveCSS("font-size", "14px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("검색 노출은 보류하면서 SNS 공유와 구조화 설명을 제공한다", async ({ page }) => {
  // 아직 검색 결과에는 등록하지 않지만, 링크 공유 미리보기와 AI용 설명은 미리 준비되어 있어야 합니다.
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const homeImage = await page.request.get("/opengraph-image");
  expect(homeImage.ok()).toBe(true);
  expect(homeImage.headers()["content-type"]).toContain("image/png");

  const homeStructuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(homeStructuredData.join(" ")).toContain('"@type":"WebSite"');
  expect(homeStructuredData.join(" ")).toContain('"@type":"FAQPage"');

  await page.goto("/products/weekly-work-planner");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/products\/weekly-work-planner$/);
  const productStructuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(productStructuredData.join(" ")).toContain('"@type":"Product"');
  expect(productStructuredData.join(" ")).toContain('"priceCurrency":"KRW"');
  const productImage = await page.request.get("/products/weekly-work-planner/opengraph-image");
  expect(productImage.ok()).toBe(true);
  expect(productImage.headers()["content-type"]).toContain("image/png");

  const robotsResponse = await page.request.get("/robots.txt");
  expect(await robotsResponse.text()).not.toContain("Disallow: /\n");
});
