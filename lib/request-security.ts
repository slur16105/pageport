import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { env } from "./env";

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export function privacyHash(value: string) {
  return createHash("sha256").update(`${env().EMAIL_VERIFICATION_SECRET}:${value}`).digest("hex");
}

export async function allowRequest(key: string, limit: number, windowSeconds: number) {
  const rows = await prisma.$queryRaw<Array<{ allowed: boolean }>>(Prisma.sql`
    SELECT public.enforce_request_limit(${key}, ${limit}, ${windowSeconds}) AS allowed
  `);
  return rows[0]?.allowed === true;
}

export async function verifyTurnstile(token: string | undefined, request: Request) {
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
