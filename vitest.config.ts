import { defineConfig } from "vitest/config";

// 빠른 기능 시험이 브라우저와 비슷한 가상 화면에서 실행되도록 정합니다.
export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["tests/**/*.test.{ts,tsx}"] },
});
