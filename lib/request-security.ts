// 이 파일은 반복 요청 제한, 개인정보를 가린 식별값, 자동화 공격 확인 기능을 제공합니다.
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { env } from "./env";

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export function privacyHash(value: string) {
  // IP나 이메일 원문 대신 해시값을 장부에 남겨 개인정보 노출을 줄입니다.
  return createHash("sha256").update(`${env().EMAIL_VERIFICATION_SECRET}:${value}`).digest("hex");
}

export async function allowRequest(key: string, limit: number, windowSeconds: number) {
  // 짧은 시간에 너무 많은 요청이 오면 데이터베이스 규칙으로 차단합니다.
  const rows = await prisma.$queryRaw<Array<{ allowed: boolean }>>(Prisma.sql`
    SELECT public.enforce_request_limit(${key}, ${limit}, ${windowSeconds}) AS allowed
  `);
  return rows[0]?.allowed === true;
}

export async function verifyTurnstile(token: string | undefined, request: Request) {
  // Turnstile이 설정된 운영 환경에서는 사람이 보낸 요청인지 Cloudflare에 확인합니다.
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  body.set("remoteip", requestIp(request));
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
