import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { ensureDownloadGrantsSchema } from "../db/ensure-download-grants";
import { downloadGrants } from "../db/schema";

const LINK_LIFETIME_MS = 24 * 60 * 60_000;

function getDownloadSecret() {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const secret = runtimeEnv.DOWNLOAD_LINK_SECRET;
  if (!secret || secret.length < 24) throw new Error("DOWNLOAD_LINK_SECRET 설정이 필요합니다.");
  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(getDownloadSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function createDownloadGrant(orderId: string, productSlug: string) {
  await ensureDownloadGrantsSchema();
  const expiresAt = Date.now() + LINK_LIFETIME_MS;
  const objectKey = `products/${productSlug}.pdf`;
  await getDb().insert(downloadGrants).values({
    orderId,
    productSlug,
    objectKey,
    expiresAt,
    downloadCount: 0,
    lastDownloadedAt: null,
  }).onConflictDoUpdate({
    target: downloadGrants.orderId,
    set: { productSlug, objectKey, expiresAt, downloadCount: 0, lastDownloadedAt: null },
  });
  return makeDownloadToken(orderId, expiresAt);
}

export async function getExistingDownloadGrant(orderId: string) {
  await ensureDownloadGrantsSchema();
  const [grant] = await getDb().select().from(downloadGrants).where(eq(downloadGrants.orderId, orderId)).limit(1);
  if (!grant || grant.expiresAt <= Date.now()) return null;
  return { grant, token: await makeDownloadToken(orderId, grant.expiresAt) };
}

async function makeDownloadToken(orderId: string, expiresAt: number) {
  const payload = `${orderId}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyDownloadToken(token: string) {
  const [orderId, expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!orderId || !Number.isInteger(expiresAt) || !signature || expiresAt <= Date.now()) return null;
  const expected = await sign(`${orderId}.${expiresAt}`);
  if (expected.length !== signature.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0 ? { orderId, expiresAt } : null;
}

export function downloadUrl(request: Request, token: string) {
  return new URL(`/api/download/${encodeURIComponent(token)}`, request.url).toString();
}
