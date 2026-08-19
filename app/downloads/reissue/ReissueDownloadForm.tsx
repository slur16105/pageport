"use client";

import { useState } from "react";

type Purchase = { orderId: string; productTitle: string; sellerName: string; amount: number; purchasedAt: string | null };

export function ReissueDownloadForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [result, setResult] = useState<{ productTitle: string; downloadUrl: string; emailSent: boolean } | null>(null);

  function updateEmail(value: string) {
    setEmail(value);
    setCode("");
    setSent(false);
    setVerificationToken("");
    setPurchases(null);
    setMessage("");
  }

  async function sendCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("구매 이메일 주소를 확인해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("인증번호를 보내고 있습니다.");
    try {
      const response = await fetch("/api/email/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, purpose: "redownload" }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "인증번호를 보내지 못했습니다.");
      setSent(true);
      setMessage("구매 이메일로 인증번호를 보냈습니다. 10분 안에 입력해 주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "인증번호를 보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndLoadPurchases() {
    if (!/^\d{6}$/.test(code)) {
      setMessage("이메일로 받은 6자리 인증번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("구매 상품을 확인하고 있습니다.");
    try {
      const verifyResponse = await fetch("/api/email/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const verified = await verifyResponse.json() as { verificationToken?: string; error?: string };
      if (!verifyResponse.ok || !verified.verificationToken) throw new Error(verified.error ?? "이메일을 확인하지 못했습니다.");

      const response = await fetch("/api/downloads/purchases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, emailVerificationToken: verified.verificationToken }),
      });
      const data = await response.json() as { purchases?: Purchase[]; error?: string };
      if (!response.ok || !data.purchases) throw new Error(data.error ?? "구매 상품을 불러오지 못했습니다.");
      setVerificationToken(verified.verificationToken);
      setPurchases(data.purchases);
      setMessage(data.purchases.length ? "다시 받을 상품을 선택해 주세요." : "이 이메일로 결제 완료된 상품을 찾지 못했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "구매 상품을 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function reissue(orderId: string) {
    setBusy(true);
    setMessage("새 다운로드 주소를 만들고 있습니다.");
    try {
      const response = await fetch("/api/downloads/reissue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, email, emailVerificationToken: verificationToken }),
      });
      const data = await response.json() as { productTitle?: string; downloadUrl?: string; emailSent?: boolean; error?: string };
      if (!response.ok || !data.productTitle || !data.downloadUrl) throw new Error(data.error ?? "새 다운로드 주소를 만들지 못했습니다.");
      setResult({ productTitle: data.productTitle, downloadUrl: data.downloadUrl, emailSent: Boolean(data.emailSent) });
      setMessage(data.emailSent ? "새 다운로드 주소를 이메일로도 보냈습니다." : "새 주소가 발급되었습니다. 이메일 발송이 지연되어 아래 버튼을 이용해 주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "새 다운로드 주소를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reissue-card">
      {!result && purchases === null && <>
        <label><span>구매 이메일</span><div className="email-verify-row"><input value={email} onChange={(event) => updateEmail(event.target.value)} type="email" placeholder="name@example.com" autoComplete="email" disabled={sent} /><button type="button" onClick={sent ? () => updateEmail(email) : sendCode} disabled={busy}>{sent ? "이메일 수정" : "인증번호 받기"}</button></div></label>
        {sent && <div className="code-row"><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="6자리 인증번호" aria-label="6자리 이메일 인증번호" /><button type="button" onClick={verifyAndLoadPurchases} disabled={busy}>구매 상품 확인</button></div>}
      </>}
      {!result && purchases !== null && <div className="purchase-history"><p className="verified-email">✓ {email} 확인 완료</p><h2>구매한 상품</h2>{purchases.map((purchase) => <div className="purchase-history-item" key={purchase.orderId}><div><strong>{purchase.productTitle}</strong><small>{purchase.sellerName} · {new Intl.NumberFormat("ko-KR").format(purchase.amount)}원</small></div><button type="button" onClick={() => reissue(purchase.orderId)} disabled={busy}>새 주소 받기</button></div>)}</div>}
      {!result && message && <p className="checkout-message" role="status">{message}</p>}
      {result && <div className="reissue-result"><div className="result-icon">✓</div><p>새 주소 발급 완료</p><h2>{result.productTitle}</h2><a className="download-button" href={result.downloadUrl}>PDF 다운로드</a><small>{message}<br />이 주소는 24시간 또는 5회 다운로드까지 사용할 수 있습니다.</small></div>}
      <p className="secure-note">이메일 인증 한 번으로 상품 한 개의 주소를 새로 받을 수 있습니다.</p>
    </div>
  );
}
