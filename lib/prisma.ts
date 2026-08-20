// 이 파일은 PAGEPORT 서버와 PostgreSQL 데이터베이스 사이의 공용 연결을 만듭니다.
import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  // 개발 중 화면을 새로 불러올 때 연결이 계속 늘어나지 않도록 기존 연결을 재사용합니다.
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
