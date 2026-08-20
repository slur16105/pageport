// 이 파일은 관리자 이메일 확인, 로그인 쿠키 생성, 로그인 상태 검사를 담당합니다.
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export const ADMIN_COOKIE = "pageport_admin";
const SESSION_MS = 12 * 60 * 60_000;

export function getAdminEmails() {
  const config = env();
  return Array.from(
    new Set(
      [config.ADMIN_EMAIL, ...(config.ADMIN_EMAILS?.split(",") ?? [])]
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function isAdminEmail(email: string) {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

function sign(value: string) {
  // 서버만 아는 비밀키로 서명해 사용자가 관리자 쿠키를 임의로 만들 수 없게 합니다.
  return createHmac("sha256", env().ADMIN_SESSION_SECRET).update(`admin:${value}`).digest("base64url");
}

export async function createAdminSession(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isAdminEmail(normalizedEmail)) throw new Error("등록되지 않은 관리자 이메일입니다.");
  const expiresAt = Date.now() + SESSION_MS;
  const payload = `${normalizedEmail}.${expiresAt}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export async function verifyAdminSession(token: string | undefined) {
  // 서명과 만료 시간을 모두 검사해 변조되거나 오래된 관리자 로그인을 거부합니다.
  if (!token) return false;
  const parts = token.split(".");
  const signature = parts.pop();
  const expiresAt = Number(parts.pop());
  const email = parts.join(".");
  if (!signature || !isAdminEmail(email) || !Number.isInteger(expiresAt) || expiresAt <= Date.now()) return false;
  const expected = sign(`${email}.${expiresAt}`);
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function cookieValue(request: Request, name: string) {
  return (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function isAdminRequest(request: Request) {
  return verifyAdminSession(cookieValue(request, ADMIN_COOKIE));
}
