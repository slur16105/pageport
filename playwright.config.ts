import { defineConfig, devices } from "@playwright/test";

// 다른 프로그램과 겹치지 않도록 실행 시 받은 포트를 쓰고, 없으면 기본값 3000을 사용합니다.
const port = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  // 실제 브라우저 시험은 tests/e2e 폴더에서 한 개씩 안정적으로 실행합니다.
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    // 일반 PC 크롬과 아이폰 사파리 환경을 각각 확인합니다.
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
  webServer: {
    // 자동검사에서는 완성 빌드를, 개발 컴퓨터에서는 빠른 개발 서버를 실행합니다.
    command: process.env.CI ? "node node_modules/next/dist/bin/next start" : "node node_modules/next/dist/bin/next dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
