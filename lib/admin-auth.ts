import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export const ADMIN_COOKIE = "pageport_admin";
const SESSION_MS = 12 * 60 * 60_000;

export function getAdminEmail() {
  return env().ADMIN_EMAIL.trim().toLowerCase();
}

function sign(value: string) {
  return createHmac("sha256", env().ADMIN_SESSION_SECRET).update(`admin:${value}`).digest("base64url");
}

export async function createAdminSession() {
  const expiresAt = Date.now() + SESSION_MS;
  const payload = `${getAdminEmail()}.${expiresAt}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  const signature = parts.pop();
  const expiresAt = Number(parts.pop());
  const email = parts.join(".");
  if (!signature || email !== getAdminEmail() || !Number.isInteger(expiresAt) || expiresAt <= Date.now()) return false;
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
