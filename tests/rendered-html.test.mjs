import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the PAGEPORT marketplace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>PAGEPORT/);
  assert.match(html, /전문 지식이/);
  assert.match(html, /weekly-work-planner/);
  assert.match(html, /이메일 하나로/);
});

test("keeps Toss payment secrets on the server", async () => {
  const [checkout, confirmation] = await Promise.all([
    readFile(new URL("../app/checkout/[slug]/CheckoutForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/payments/confirm/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(checkout, /test_gck_docs_/);
  assert.match(checkout, /windowTarget:\s*"self"/);
  assert.doesNotMatch(checkout, /test_gsk_|test_sk_/);
  assert.match(confirmation, /test_gsk_docs_/);
  assert.match(confirmation, /order\.amount !== payload\.amount/);
  assert.match(confirmation, /order\.isTest/);
});

test("uses server-verified email codes before creating an order", async () => {
  const [checkout, sendCode, verifyCode, orders] = await Promise.all([
    readFile(new URL("../app/checkout/[slug]/CheckoutForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/email/send-code/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/email/verify-code/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(checkout, /123456|testEmailVerified/);
  assert.match(checkout, /emailVerificationToken/);
  assert.match(sendCode, /RESEND_API_KEY/);
  assert.match(sendCode, /RESEND_INTERVAL_MS/);
  assert.match(verifyCode, /MAX_ATTEMPTS = 5/);
  assert.match(orders, /verifyEmailToken/);
});

test("protects paid PDF downloads with expiring signed links", async () => {
  const [downloadRoute, downloadLinks, successPage, unavailablePage] = await Promise.all([
    readFile(new URL("../app/api/download/[token]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/download-links.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/payment/success/PaymentSuccess.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/downloads/unavailable/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(downloadLinks, /24 \* 60 \* 60_000/);
  assert.match(downloadLinks, /HMAC/);
  assert.match(downloadRoute, /\["paid", "test_paid"\]/);
  assert.match(downloadRoute, /MAX_DOWNLOADS_PER_LINK = 5/);
  assert.match(downloadRoute, /lt\(downloadGrants\.downloadCount, MAX_DOWNLOADS_PER_LINK\)/);
  assert.match(downloadRoute, /orders\.totalDownloadCount/);
  assert.match(downloadRoute, /private, no-store/);
  assert.match(downloadRoute, /text\/html/);
  assert.match(downloadRoute, /downloads\/unavailable/);
  assert.match(successPage, /PDF 다운로드/);
  assert.match(unavailablePage, /환불이 완료된 주문이에요/);
  assert.match(unavailablePage, /새 다운로드 주소 받기/);
});

test("emails the paid PDF link once per order", async () => {
  const [confirmation, purchaseEmail, schema] = await Promise.all([
    readFile(new URL("../app/api/payments/confirm/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/purchase-email.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(confirmation, /sendReceiptIfNeeded/);
  assert.match(confirmation, /receiptEmailSentAt/);
  assert.match(purchaseEmail, /Idempotency-Key/);
  assert.match(purchaseEmail, /purchase-complete-/);
  assert.match(schema, /receipt_email_sent_at/);
});

test("lists email purchases and reissues one download after verification", async () => {
  const [purchaseRoute, reissueRoute, verification, reissuePage, purchaseTemplate] = await Promise.all([
    readFile(new URL("../app/api/downloads/purchases/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/downloads/reissue/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/email-verification.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/downloads/reissue/ReissueDownloadForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../emails/purchase-complete.ts", import.meta.url), "utf8"),
  ]);

  assert.match(purchaseRoute, /verifyEmailToken/);
  assert.match(purchaseRoute, /orders\.buyerEmail/);
  assert.match(reissueRoute, /consumeEmailToken/);
  assert.match(reissueRoute, /\["paid", "test_paid"\]/);
  assert.match(reissueRoute, /createDownloadGrant/);
  assert.match(verification, /verificationTokenHash: null/);
  assert.match(reissuePage, /purpose: "redownload"/);
  assert.doesNotMatch(reissuePage, /주문번호/);
  assert.match(reissuePage, /구매한 상품/);
  assert.match(purchaseTemplate, /다운로드 주소 다시 받기/);
});

test("protects product management with an administrator email session", async () => {
  const [adminAuth, adminSession, adminProducts, adminPage, home, orderRoute] = await Promise.all([
    readFile(new URL("../lib/admin-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/products/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(adminAuth, /ADMIN_EMAIL/);
  assert.match(adminAuth, /HMAC/);
  assert.match(adminSession, /HttpOnly/);
  assert.match(adminSession, /SameSite=Strict/);
  assert.match(adminProducts, /isAdminRequest/);
  assert.match(adminProducts, /MAX_PDF_BYTES/);
  assert.match(adminProducts, /getFiles\(\)\.put/);
  assert.match(adminProducts, /crypto\.randomUUID/);
  assert.match(adminPage, /상품 저장/);
  assert.match(adminPage, /판매 중지/);
  assert.match(adminPage, /상품 주소는 저장할 때 자동으로 만들어집니다/);
  assert.doesNotMatch(adminPage, /상품 주소용 영문 이름/);
  assert.match(home, /listPublishedProducts/);
  assert.match(orderRoute, /getPublishedProduct/);
});

test("shows protected order and download activity in the administrator dashboard", async () => {
  const [orderAdmin, refundAdmin, refundEmail, refundTemplate, adminPage, downloadRoute, schema] = await Promise.all([
    readFile(new URL("../app/api/admin/orders/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/orders/refund/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/refund-email.ts", import.meta.url), "utf8"),
    readFile(new URL("../emails/refund-complete.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/download/[token]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(orderAdmin, /isAdminRequest/);
  assert.match(orderAdmin, /leftJoin\(downloadGrants/);
  assert.match(orderAdmin, /orders\.totalDownloadCount/);
  assert.match(adminPage, /다운로드 횟수 새로고침/);
  assert.match(adminPage, /전체 다운로드/);
  assert.match(adminPage, /주문 관리/);
  assert.match(adminPage, /구매 이메일/);
  assert.match(adminPage, /시험 결제 합계/);
  assert.match(adminPage, /검토 후 환불/);
  assert.match(adminPage, /role="dialog"/);
  assert.match(adminPage, /전액 환불 확정/);
  assert.doesNotMatch(adminPage, /window\.(prompt|confirm)/);
  assert.match(refundAdmin, /isAdminRequest/);
  assert.match(refundAdmin, /\/cancel/);
  assert.match(refundAdmin, /Idempotency-Key/);
  assert.match(refundAdmin, /reviewedAfterDownload/);
  assert.match(refundAdmin, /status: "refunded"/);
  assert.match(refundAdmin, /sendRefundEmailIfNeeded/);
  assert.match(refundEmail, /Idempotency-Key/);
  assert.match(refundEmail, /refund-complete-/);
  assert.match(refundTemplate, /환불 처리가 완료되었습니다/);
  assert.match(adminPage, /환불 메일 보내기/);
  assert.match(schema, /refund_email_sent_at/);
  assert.match(downloadRoute, /\["paid", "test_paid"\]/);
});
