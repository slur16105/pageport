"use client";

// 운영자가 이메일로 본인 확인한 뒤 상품을 등록·수정하고 주문과 환불을 관리하는 관리자 화면입니다.

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import * as tus from "tus-js-client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, FileUp, Menu, RefreshCw, ShieldCheck, X } from "lucide-react";
import { TurnstileWidget } from "../../components/TurnstileWidget";
import { explainAdminUploadError, type AdminUploadIssue } from "../../lib/admin-upload-errors";
import { PRODUCT_CATEGORIES, PRODUCT_LIMITS, productIncludeItems } from "../../lib/product-limits";

type AdminProduct = {
  slug: string;
  category: string;
  title: string;
  sellerName: string;
  description: string;
  amount: number;
  accent: string;
  mark: string;
  pages: number;
  fileSize: string;
  summary: string;
  includes: string[];
  status: string;
};

type ProductForm = Omit<AdminProduct, "fileSize" | "includes"> & { includes: string };

type AdminOrder = {
  orderId: string;
  productTitle: string;
  sellerName: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: string;
  isTest: boolean;
  approvedAt: string | null;
  createdAt: string;
  downloadCount: number;
  lastDownloadedAt: number | null;
  refundedAt: string | null;
  refundReason: string | null;
  refundEmailSentAt: string | null;
};

const emptyForm: ProductForm = {
  slug: "",
  category: "업무·생산성",
  title: "",
  sellerName: "PAGEPORT",
  description: "",
  amount: 4900,
  accent: "mint",
  mark: "PDF",
  pages: 1,
  summary: "",
  includes: "",
  status: "draft",
};

const statusLabels: Record<string, string> = { draft: "작성 중", published: "판매 중", paused: "판매 중지" };

type AdminView = "products" | "orders";

function AdminManagementMenu({
  view,
  className,
  label,
  onProducts,
  onOrders,
}: {
  view: AdminView;
  className: string;
  label: string;
  onProducts: () => void;
  onOrders: () => void;
}) {
  // PC 상단 메뉴와 모바일 패널이 같은 메뉴 이름·활성 상태·동작을 공유합니다.
  return (
    <nav className={className} aria-label={label}>
      <button className={view === "products" ? "active" : ""} type="button" onClick={onProducts}>
        상품 관리
      </button>
      <button className={view === "orders" ? "active" : ""} type="button" onClick={onOrders}>
        주문 관리
      </button>
    </nav>
  );
}

function StorefrontLink({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link className={className} href="/" target="_blank" rel="noreferrer" onClick={onClick}>
      쇼핑몰로 이동
      <ExternalLink size={15} aria-hidden="true" />
    </Link>
  );
}

function FieldLimit({ current, maximum, unit = "자" }: { current: number; maximum: number; unit?: string }) {
  const nearLimit = current >= maximum * 0.8;
  return (
    <small className={nearLimit ? "admin-field-limit near-limit" : "admin-field-limit"}>
      {current.toLocaleString("ko-KR")} / {maximum.toLocaleString("ko-KR")}
      {unit}
    </small>
  );
}

async function uploadPdf(file: File, onProgress: (percent: number) => void) {
  // 먼저 서버에서 일회용 업로드 허가를 받은 뒤, 전송이 끊겨도 이어 올릴 수 있는 방식으로 PDF를 보냅니다.
  const ticketResponse = await fetch("/api/admin/uploads/ticket", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName: file.name, fileSize: file.size, contentType: file.type }),
  });
  const ticket = (await ticketResponse.json()) as {
    endpoint?: string;
    bucketName?: string;
    objectKey?: string;
    authorization?: string;
    code?: string;
    error?: string;
  };
  if (!ticketResponse.ok || !ticket.endpoint || !ticket.bucketName || !ticket.objectKey || !ticket.authorization)
    throw new Error(ticket.code ?? ticket.error ?? "업로드를 준비하지 못했습니다.");
  const { endpoint, bucketName, objectKey, authorization } = ticket;
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000],
      // TUS가 요구하는 anon JWT로 인증하고, 실제 저장 위치는 일회용 업로드 허가증과 RLS가 제한합니다.
      // 매번 새 UUID 경로를 쓰므로 기존 파일 덮어쓰기 권한은 요청하지 않습니다.
      headers: { authorization: `Bearer ${authorization}` },
      metadata: { bucketName, objectName: objectKey, contentType: "application/pdf", cacheControl: "3600" },
      uploadSize: file.size,
      removeFingerprintOnSuccess: true,
      onError: (error) => reject(error),
      onProgress: (uploaded, total) => onProgress(Math.round((uploaded / total) * 100)),
      onSuccess: () => resolve(),
    });
    void upload.findPreviousUploads().then((previous) => {
      if (previous[0]) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
  const fileSize =
    file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(file.size / 1024)}KB`;
  return { objectKey, fileSize };
}

export function AdminDashboard() {
  // 로그인 여부, 보고 있는 메뉴, 상품 입력값, 주문·환불 진행 상태를 이 화면 안에서 각각 기억합니다.
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [view, setView] = useState<AdminView>("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundReviewed, setRefundReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("관리자 확인 중…");
  const [uploadIssue, setUploadIssue] = useState<AdminUploadIssue | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const includeItems = productIncludeItems(form.includes);
  const includesInvalid =
    includeItems.length > PRODUCT_LIMITS.includesCount ||
    includeItems.some((item) => item.length > PRODUCT_LIMITS.includeItem);

  useEffect(() => {
    // 화면이 처음 열리면 기존 관리자 로그인이 살아 있는지 확인하고, 맞으면 상품 목록을 바로 불러옵니다.
    fetch("/api/admin/session")
      .then((response) => response.json() as Promise<{ authenticated?: boolean }>)
      .then((data) => {
        const loggedIn = Boolean(data.authenticated);
        setAuthenticated(loggedIn);
        setMessage(loggedIn ? "" : "관리자 이메일로 로그인해 주세요.");
        if (loggedIn) void loadProducts();
      })
      .catch(() => {
        setAuthenticated(false);
        setMessage("관리자 로그인을 확인하지 못했습니다.");
      });
  }, []);

  async function loadProducts() {
    const response = await fetch("/api/admin/products");
    const data = (await response.json()) as { products?: AdminProduct[]; error?: string };
    if (!response.ok || !data.products) throw new Error(data.error ?? "상품 목록을 불러오지 못했습니다.");
    setProducts(data.products);
  }

  async function loadOrders() {
    const response = await fetch("/api/admin/orders");
    const data = (await response.json()) as { orders?: AdminOrder[]; error?: string };
    if (!response.ok || !data.orders) throw new Error(data.error ?? "주문 목록을 불러오지 못했습니다.");
    setOrders(data.orders);
  }

  function openOrders() {
    setView("orders");
    setMessage("주문 내역을 불러오고 있습니다.");
    void loadOrders()
      .then(() => setMessage(""))
      .catch((error) => setMessage(error instanceof Error ? error.message : "주문 목록을 불러오지 못했습니다."));
  }

  function refreshOrders() {
    setMessage("다운로드 횟수를 새로 확인하고 있습니다.");
    void loadOrders()
      .then(() => setMessage(""))
      .catch((error) => setMessage(error instanceof Error ? error.message : "주문 목록을 새로 불러오지 못했습니다."));
  }

  function openRefund(order: AdminOrder) {
    setRefundTarget(order);
    setRefundReason(order.downloadCount > 0 ? "파일 오류 또는 상품 설명 불일치" : "구매자 요청");
    setRefundReviewed(false);
  }

  async function refundOrder() {
    // 다운로드한 주문은 관리자가 환불 기준을 검토했다는 확인까지 해야 환불 요청을 보낼 수 있습니다.
    if (!refundTarget || !refundReason.trim() || (refundTarget.downloadCount > 0 && !refundReviewed)) return;
    setBusy(true);
    setMessage("토스 결제 환불을 처리하고 있습니다.");
    try {
      const response = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: refundTarget.orderId,
          reason: refundReason.trim(),
          reviewedAfterDownload: refundTarget.downloadCount > 0,
        }),
      });
      const data = (await response.json()) as { refunded?: boolean; emailSent?: boolean; error?: string };
      if (!response.ok || !data.refunded) throw new Error(data.error ?? "환불을 완료하지 못했습니다.");
      await loadOrders();
      setRefundTarget(null);
      setMessage(
        data.emailSent
          ? "환불을 완료하고 구매자에게 안내 이메일을 보냈습니다."
          : "환불은 완료했지만 안내 이메일은 보내지 못했습니다. 주문 화면에서 다시 보낼 수 있습니다.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "환불을 완료하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function sendRefundEmail(order: AdminOrder) {
    setBusy(true);
    setMessage("환불 완료 이메일을 보내고 있습니다.");
    try {
      const response = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      const data = (await response.json()) as { refunded?: boolean; emailSent?: boolean; error?: string };
      if (!response.ok || !data.refunded || !data.emailSent)
        throw new Error(data.error ?? "환불 완료 이메일을 보내지 못했습니다.");
      await loadOrders();
      setMessage("구매자에게 환불 완료 이메일을 보냈습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "환불 완료 이메일을 보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    setBusy(true);
    setMessage("관리자 인증번호를 보내고 있습니다.");
    try {
      const response = await fetch("/api/email/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, purpose: "admin", turnstileToken }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "인증번호를 보내지 못했습니다.");
      setSent(true);
      setMessage("관리자 이메일로 인증번호를 보냈습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "인증번호를 보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    // 이메일 인증번호가 맞는지 확인한 뒤 관리자 전용 세션을 만들어 관리 기능을 엽니다.
    if (!/^\d{6}$/.test(code)) {
      setMessage("6자리 인증번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const verifyResponse = await fetch("/api/email/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const verified = (await verifyResponse.json()) as { verificationToken?: string; error?: string };
      if (!verifyResponse.ok || !verified.verificationToken)
        throw new Error(verified.error ?? "인증번호를 확인하지 못했습니다.");
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, emailVerificationToken: verified.verificationToken }),
      });
      const data = (await response.json()) as { authenticated?: boolean; error?: string };
      if (!response.ok || !data.authenticated) throw new Error(data.error ?? "관리자 로그인을 완료하지 못했습니다.");
      setAuthenticated(true);
      await loadProducts();
      setMessage("관리자 로그인이 완료되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "관리자 로그인을 완료하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setProducts([]);
    setOrders([]);
    setSent(false);
    setCode("");
    setMessage("로그아웃했습니다.");
  }

  function editProduct(product: AdminProduct) {
    setForm({ ...product, includes: product.includes.join("\n") });
    setEditing(true);
    setFile(null);
    setUploadIssue(null);
    setMessage(`${product.title} 정보를 불러왔습니다.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newProduct() {
    setForm(emptyForm);
    setEditing(false);
    setFile(null);
    setUploadIssue(null);
    setMessage("새 상품 정보를 입력해 주세요. 먼저 작성 중으로 저장할 수 있습니다.");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    // 새 PDF가 있으면 먼저 파일을 올리고, 그 저장 위치와 입력한 상품 정보를 함께 저장합니다.
    event.preventDefault();
    setBusy(true);
    setUploadIssue(null);
    setMessage(file ? "PDF 업로드를 준비하고 있습니다." : "상품을 안전하게 저장하고 있습니다.");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.set(key, String(value)));
      if (file) {
        const uploaded = await uploadPdf(file, (percent) =>
          setMessage(`PDF를 안전하게 업로드하고 있습니다. ${percent}%`),
        );
        body.set("uploadedObjectKey", uploaded.objectKey);
        body.set("uploadedFileSize", uploaded.fileSize);
      }
      const response = await fetch("/api/admin/products", { method: "POST", body });
      const data = (await response.json()) as { product?: AdminProduct; error?: string };
      if (!response.ok || !data.product) throw new Error(data.error ?? "상품을 저장하지 못했습니다.");
      await loadProducts();
      setForm({ ...data.product, includes: data.product.includes.join("\n") });
      setEditing(true);
      setFile(null);
      setUploadIssue(null);
      setMessage(data.product.status === "published" ? "상품을 저장하고 판매를 시작했습니다." : "상품을 저장했습니다.");
    } catch (error) {
      setUploadIssue(explainAdminUploadError(error));
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  // 로그인 확인 중, 로그인 전, 로그인 후 화면을 분리해 권한 없는 상태에서 관리 내용이 보이지 않게 합니다.
  if (authenticated === null)
    return (
      <main className="admin-page">
        <p className="admin-loading">관리자 확인 중…</p>
      </main>
    );
  if (!authenticated)
    return (
      <main className="admin-page">
        <section className="admin-login">
          <Link className="brand" href="/">
            PAGEPORT<span>.</span>
          </Link>
          <p className="eyebrow">ADMIN</p>
          <h1>관리자 로그인</h1>
          <p>등록된 관리자 이메일로 인증번호를 받아 주세요.</p>
          <label>
            <span>관리자 이메일</span>
            <div className="email-verify-row">
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSent(false);
                }}
                type="email"
                placeholder="name@example.com"
              />
              <button type="button" onClick={sendCode} disabled={busy}>
                인증번호 받기
              </button>
            </div>
          </label>
          <TurnstileWidget onToken={setTurnstileToken} />
          {sent && (
            <div className="code-row">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6자리 인증번호"
                inputMode="numeric"
              />
              <button type="button" onClick={login} disabled={busy}>
                로그인
              </button>
            </div>
          )}
          <p className="checkout-message" role="status">
            {message}
          </p>
        </section>
      </main>
    );

  return (
    <main className="admin-page">
      {/* 로그인 후에는 상품 관리와 주문 관리를 상단 메뉴로 오갈 수 있습니다. */}
      <header className="admin-header">
        <Link className="brand" href="/">
          PAGEPORT<span>.</span>
        </Link>
        <AdminManagementMenu
          view={view}
          className="admin-nav admin-desktop-nav"
          label="관리자 메뉴"
          onProducts={() => setView("products")}
          onOrders={openOrders}
        />
        <div className="admin-header-actions">
          <StorefrontLink className="admin-store-link" />
          <button type="button" onClick={logout}>
            로그아웃
          </button>
        </div>
        <div className="admin-mobile-controls">
          <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <Dialog.Trigger asChild>
              <button className="admin-menu-trigger" type="button" aria-label="관리자 메뉴 열기">
                <Menu size={21} aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="admin-menu-overlay" />
              <Dialog.Content className="admin-menu-panel" aria-describedby={undefined}>
                <div className="admin-menu-panel-header">
                  <Dialog.Title>관리자 메뉴</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" aria-label="관리자 메뉴 닫기">
                      <X size={21} aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>
                <section className="admin-menu-section" aria-labelledby="admin-management-label">
                  <p id="admin-management-label">관리 메뉴</p>
                  <AdminManagementMenu
                    view={view}
                    className="admin-mobile-nav"
                    label="모바일 관리자 메뉴"
                    onProducts={() => {
                      setView("products");
                      setMobileMenuOpen(false);
                    }}
                    onOrders={() => {
                      openOrders();
                      setMobileMenuOpen(false);
                    }}
                  />
                </section>
                <section className="admin-menu-secondary" aria-labelledby="admin-secondary-label">
                  <p id="admin-secondary-label">기타 기능</p>
                  <StorefrontLink onClick={() => setMobileMenuOpen(false)} />
                </section>
                <div className="admin-menu-logout">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void logout();
                    }}
                  >
                    로그아웃
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
      {view === "products" ? (
        /* 상품 입력 영역과 이미 등록된 상품 목록을 나란히 보여줍니다. */
        <div className="admin-shell">
          <section className="admin-editor">
            <div className="admin-title">
              <div>
                <p className="eyebrow">PRODUCT EDITOR</p>
                <h1>{editing ? "상품 수정" : "새 상품 등록"}</h1>
              </div>
              {editing && (
                <button type="button" onClick={newProduct}>
                  + 새 상품
                </button>
              )}
            </div>
            <form className="admin-form" onSubmit={saveProduct}>
              <label className="wide">
                <span>상품명</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  maxLength={PRODUCT_LIMITS.title}
                  required
                />
                <span className="admin-field-help">
                  <small>상품 주소는 저장할 때 자동으로 만들어집니다.</small>
                  <FieldLimit current={form.title.length} maximum={PRODUCT_LIMITS.title} />
                </span>
              </label>
              <label>
                <span>판매자명</span>
                <input
                  value={form.sellerName}
                  onChange={(event) => setForm({ ...form, sellerName: event.target.value })}
                  maxLength={PRODUCT_LIMITS.sellerName}
                  required
                />
                <FieldLimit current={form.sellerName.length} maximum={PRODUCT_LIMITS.sellerName} />
              </label>
              <label>
                <span>카테고리</span>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {!PRODUCT_CATEGORIES.some((category) => category === form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <small>정해진 분류를 사용하면 구매자가 상품을 더 쉽게 찾을 수 있습니다.</small>
              </label>
              <label>
                <span>판매가</span>
                <input
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                  type="number"
                  min={PRODUCT_LIMITS.amountMin}
                  max={PRODUCT_LIMITS.amountMax}
                  step="100"
                  required
                />
                <small>
                  입력 금액: {new Intl.NumberFormat("ko-KR").format(Number.isFinite(form.amount) ? form.amount : 0)}원 ·
                  최대 1,000,000원
                </small>
              </label>
              <label>
                <span>PDF 쪽수</span>
                <input
                  value={form.pages}
                  onChange={(event) => setForm({ ...form, pages: Number(event.target.value) })}
                  type="number"
                  min={PRODUCT_LIMITS.pagesMin}
                  max={PRODUCT_LIMITS.pagesMax}
                  required
                />
                <small>최대 10,000쪽</small>
              </label>
              <label>
                <span>표지 글자</span>
                <input
                  value={form.mark}
                  onChange={(event) => setForm({ ...form, mark: event.target.value })}
                  maxLength={PRODUCT_LIMITS.mark}
                  required
                />
                <FieldLimit current={form.mark.length} maximum={PRODUCT_LIMITS.mark} />
              </label>
              <label>
                <span>표지 색상</span>
                <select value={form.accent} onChange={(event) => setForm({ ...form, accent: event.target.value })}>
                  <option value="mint">민트</option>
                  <option value="yellow">노랑</option>
                  <option value="blue">파랑</option>
                  <option value="pink">분홍</option>
                  <option value="purple">보라</option>
                  <option value="orange">주황</option>
                  <option value="lime">연두</option>
                  <option value="coral">코랄</option>
                </select>
              </label>
              <label className="wide">
                <span>한 줄 소개</span>
                <input
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  maxLength={PRODUCT_LIMITS.description}
                  required
                />
                <FieldLimit current={form.description.length} maximum={PRODUCT_LIMITS.description} />
              </label>
              <label className="wide">
                <span>상세 설명</span>
                <textarea
                  value={form.summary}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })}
                  maxLength={PRODUCT_LIMITS.summary}
                  rows={4}
                  required
                />
                <FieldLimit current={form.summary.length} maximum={PRODUCT_LIMITS.summary} />
              </label>
              <label className="wide">
                <span>상품 구성 · 한 줄에 하나</span>
                <textarea
                  value={form.includes}
                  onChange={(event) => setForm({ ...form, includes: event.target.value })}
                  maxLength={PRODUCT_LIMITS.includesText}
                  rows={4}
                  required
                />
                <small className={includesInvalid ? "admin-field-limit invalid" : "admin-field-limit"}>
                  {includeItems.length} / {PRODUCT_LIMITS.includesCount}개 · 항목당 최대 {PRODUCT_LIMITS.includeItem}자
                </small>
              </label>
              <label className="wide">
                <span>
                  <FileUp size={16} aria-hidden="true" /> PDF 파일 {editing && "· 바꿀 때만 선택"}
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  required={!editing}
                />
                <small>25MB 이하 PDF만 등록할 수 있습니다. 전송이 끊기면 이어서 업로드합니다.</small>
              </label>
              <label>
                <span>판매 상태</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="draft">작성 중</option>
                  <option value="published">판매 중</option>
                  <option value="paused">판매 중지</option>
                </select>
              </label>
              <button className="admin-save" type="submit" disabled={busy || includesInvalid}>
                {busy ? "저장 중…" : "상품 저장"}
              </button>
            </form>
            {message && (
              <p className="checkout-message" role="status">
                {message}
              </p>
            )}
            {uploadIssue && (
              <section className="admin-action-alert" role="alert" aria-live="assertive">
                <strong>{uploadIssue.title}</strong>
                <p>{uploadIssue.description}</p>
                <p>
                  <b>다음 단계</b> {uploadIssue.action}
                </p>
              </section>
            )}
          </section>
          <aside className="admin-products">
            <div>
              <p className="eyebrow">CATALOG</p>
              <h2>등록 상품 {products.length}개</h2>
            </div>
            {products.map((product) => (
              <button
                type="button"
                className="admin-product-row"
                onClick={() => editProduct(product)}
                key={product.slug}
              >
                <span className={`admin-product-mark ${product.accent}`}>{product.mark}</span>
                <span>
                  <strong>{product.title}</strong>
                  <small>
                    {new Intl.NumberFormat("ko-KR").format(product.amount)}원 ·{" "}
                    {statusLabels[product.status] ?? product.status}
                  </small>
                </span>
                <b>수정</b>
              </button>
            ))}
          </aside>
        </div>
      ) : (
        <OrderManagement
          orders={orders}
          message={message}
          busy={busy}
          onRefresh={refreshOrders}
          onRefund={openRefund}
          onRefundEmail={sendRefundEmail}
        />
      )}
      {/* 환불은 되돌리기 어려우므로 별도의 확인창에서 사유와 다운로드 여부를 다시 검토합니다. */}
      <AlertDialog.Root
        open={Boolean(refundTarget)}
        onOpenChange={(open) => {
          if (!open && !busy) setRefundTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="refund-modal-backdrop" />
          <AlertDialog.Content className="refund-modal">
            <p className="eyebrow">REFUND</p>
            <AlertDialog.Title id="refund-title">전액 환불 확인</AlertDialog.Title>
            <AlertDialog.Description asChild>
              <p>
                <strong>{refundTarget?.productTitle}</strong>
                <br />
                주문번호 {refundTarget?.orderId}
              </p>
            </AlertDialog.Description>
            {refundTarget && refundTarget.downloadCount > 0 && (
              <div className="refund-warning">
                <strong>이미 {refundTarget.downloadCount}회 다운로드한 주문입니다.</strong>
                <p>단순 변심이 아닌 파일 오류 또는 상품 설명 불일치인지 확인해 주세요.</p>
                <label>
                  <input
                    type="checkbox"
                    checked={refundReviewed}
                    onChange={(event) => setRefundReviewed(event.target.checked)}
                  />{" "}
                  환불 기준을 확인하고 검토했습니다.
                </label>
              </div>
            )}
            <label className="refund-reason">
              <span>환불 사유</span>
              <textarea
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value.slice(0, 200))}
                rows={3}
                maxLength={200}
              />
            </label>
            <p className="refund-note">
              <ShieldCheck size={16} aria-hidden="true" /> 환불하면 기존 다운로드 주소를 즉시 사용할 수 없습니다.
            </p>
            <div className="refund-actions">
              <AlertDialog.Cancel asChild>
                <button type="button" disabled={busy}>
                  취소
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="confirm"
                  type="button"
                  onClick={refundOrder}
                  disabled={
                    busy ||
                    !refundReason.trim() ||
                    Boolean(refundTarget && refundTarget.downloadCount > 0 && !refundReviewed)
                  }
                >
                  {busy ? (
                    <>
                      <RefreshCw size={15} aria-hidden="true" /> 환불 처리 중…
                    </>
                  ) : (
                    "전액 환불 확정"
                  )}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}

function OrderManagement({
  orders,
  message,
  busy,
  onRefresh,
  onRefund,
  onRefundEmail,
}: {
  orders: AdminOrder[];
  message: string;
  busy: boolean;
  onRefresh: () => void;
  onRefund: (order: AdminOrder) => void;
  onRefundEmail: (order: AdminOrder) => void;
}) {
  // 결제 완료 건수와 합계를 계산하고, 주문별 다운로드·환불 상태를 표로 정리합니다.
  const paid = orders.filter((order) => ["paid", "test_paid"].includes(order.status));
  const sales = paid.reduce((total, order) => total + order.amount, 0);
  const statusLabel: Record<string, string> = {
    test_pending: "결제 대기",
    pending: "결제 대기",
    test_paid: "시험 결제 완료",
    paid: "결제 완료",
    refunded: "환불 완료",
  };
  return (
    <section className="admin-orders-page">
      <div className="admin-orders-title">
        <div>
          <p className="eyebrow">SALES</p>
          <h1>주문 관리</h1>
        </div>
        <button type="button" onClick={onRefresh}>
          다운로드 횟수 새로고침
        </button>
      </div>
      <div className="order-summary">
        <div>
          <span>전체 주문</span>
          <strong>{orders.length}건</strong>
        </div>
        <div>
          <span>결제 완료</span>
          <strong>{paid.length}건</strong>
        </div>
        <div>
          <span>{orders.some((order) => order.isTest) ? "시험 결제 합계" : "결제 합계"}</span>
          <strong>{new Intl.NumberFormat("ko-KR").format(sales)}원</strong>
        </div>
      </div>
      {message && (
        <p className="checkout-message" role="status">
          {message}
        </p>
      )}
      <div className="order-table-wrap">
        <table className="order-table">
          <thead>
            <tr>
              <th>주문·상태</th>
              <th>상품</th>
              <th>구매 이메일</th>
              <th>결제금액</th>
              <th>전체 다운로드</th>
              <th>주문일</th>
              <th>환불</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderId}>
                <td>
                  <strong>{order.orderId}</strong>
                  <span className={`order-status ${order.status}`}>{statusLabel[order.status] ?? order.status}</span>
                </td>
                <td>
                  <strong>{order.productTitle}</strong>
                  <small>{order.sellerName}</small>
                </td>
                <td>{order.buyerEmail}</td>
                <td>
                  {new Intl.NumberFormat("ko-KR").format(order.amount)}원{order.isTest && <small>시험 결제</small>}
                </td>
                <td>{order.downloadCount}회</td>
                <td>
                  {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(order.approvedAt ?? order.createdAt),
                  )}
                </td>
                <td>
                  {["paid", "test_paid"].includes(order.status) ? (
                    <button className="refund-button" type="button" disabled={busy} onClick={() => onRefund(order)}>
                      {order.downloadCount > 0 ? "검토 후 환불" : "환불 처리"}
                    </button>
                  ) : order.status === "refunded" ? (
                    <div className="refund-email-status">
                      <small>{order.refundReason ?? "환불 완료"}</small>
                      {order.refundEmailSentAt ? (
                        <b>메일 발송 완료</b>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => onRefundEmail(order)}>
                          환불 메일 보내기
                        </button>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!message && orders.length === 0 && <p className="empty-orders">아직 주문이 없습니다.</p>}
      </div>
    </section>
  );
}
