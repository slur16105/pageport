import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// ESLint는 실행 전에 코드에서 실수하기 쉬운 부분을 자동으로 찾아주는 검사 도구입니다.
export default defineConfig([
  // Next.js 권장 규칙, TypeScript 규칙, Prettier와 충돌하지 않는 규칙을 함께 사용합니다.
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      // 이 프로젝트의 화면 이동 방식과 상태 처리에 맞춰 두 규칙만 예외로 둡니다.
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    // 자동 생성 결과와 시험 보고서는 사람이 작성한 소스가 아니므로 검사 대상에서 제외합니다.
    ".next/**",
    "dist/**",
    "out/**",
    "output/**",
    "tmp/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
