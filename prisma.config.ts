import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// 개발 컴퓨터에만 있는 비밀 설정 파일이 있으면 읽습니다. 배포 서버에서는 Vercel 설정을 사용합니다.
if (existsSync(".env.local")) process.loadEnvFile?.(".env.local");

// Prisma가 데이터베이스 설계도, 변경 기록, 샘플 데이터 명령을 어디서 찾을지 알려줍니다.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // 구조 변경은 연결 제한 장치를 거치지 않는 데이터베이스 직접 주소로 안전하게 실행합니다.
    url: env("DIRECT_URL"),
  },
});
