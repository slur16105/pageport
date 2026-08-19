import { env } from "cloudflare:workers";

export const ADMIN_COOKIE = "pageport_admin";
const SESSION_MS = 12 * 60 * 60_000;

function runtimeEnv() {
  return env as unknown as Record<string, string | undefined>;
}

export function getAdminEmail() {
  return runtimeEnv().ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function getSecret() {
  const secret = runtimeEnv().ADMIN_SESSION_SECRET || runtimeEnv().EMAIL_VERIFICATION_SECRET;
  if (!secret || secret.length < 24) throw new Error("관리자 로그인 보안 설정이 필요합니다.");
  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`admin:${value}`))));
}

export async function createAdminSession() {
  const expiresAt = Date.now() + SESSION_MS;
  const payload = `${getAdminEmail()}.${expiresAt}`;
  return { token: `${payload}.${await sign(payload)}`, expiresAt };
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  const signature = parts.pop();
  const expiresRaw = parts.pop();
  const email = parts.join(".");
  const expiresAt = Number(expiresRaw);
  if (!email || email !== getAdminEmail() || !Number.isInteger(expiresAt) || expiresAt <= Date.now() || !signature) return false;
  const expected = await sign(`${email}.${expiresAt}`);
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
}

export function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function isAdminRequest(request: Request) {
  return verifyAdminSession(cookieValue(request, ADMIN_COOKIE));
}
