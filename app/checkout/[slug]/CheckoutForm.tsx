"use client";

// 구매 이메일 인증부터 주문 생성, 토스 시험 결제창 실행까지 순서대로 진행하는 결제 입력 화면입니다.

import { ANONYMOUS, loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState } from "react";
import { TurnstileWidget } from "../../../components/TurnstileWidget";

const TOSS_TEST_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_TEST_CLIENT_KEY ?? "";

type TestOrder = {
  id: string;
  amount: number;
  currency: "KRW";
  productTitle: string;
  buyerEmail: string;
};

export function CheckoutForm({ slug }: { slug: string }) {
  // 이메일 인증, 필수 동의, 주문 생성, 결제창 준비 상태를 각각 기억해 단계가 뒤섞이지 않게 합니다.
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [refundAcknowledged, setRefundAcknowledged] = useState(false);
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<TestOrder | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);

  useEffect(() => {
    // 상품 상세에서 미리 입력한 이메일이 있으면 다시 타이핑하지 않도록 불러옵니다.
    setEmail(sessionStorage.getItem(`pageport:checkout:${slug}:email`) ?? "");
  }, [slug]);

  useEffect(() => {
    if (!order) return;
    let active = true;

    async function preparePayment() {
      // 주문번호가 만들어진 뒤에만 토스 결제수단과 약관 화면을 현재 페이지 안에 불러옵니다.
      try {
        const tossPayments = await loadTossPayments(TOSS_TEST_CLIENT_KEY);
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        await widgets.setAmount({ currency: "KRW", value: order!.amount });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
          widgets.renderAgreement({ selector: "#payment-agreement", variantKey: "AGREEMENT" }),
        ]);
        if (!active) return;
        widgetsRef.current = widgets;
        setPaymentReady(true);
        setMessage("결제수단을 고른 뒤 아래 시험 결제 버튼을 눌러 주세요.");
      } catch {
        if (active) setMessage("토스 시험 결제 화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }

    preparePayment();
    return () => {
      active = false;
    };
  }, [order]);

  const typoDomains: Record<string, string> = {
    // 자주 생기는 이메일 도메인 오타를 발견하면 결제 전에 올바른 주소를 제안합니다.
    "gamil.com": "gmail.com",
    "gmail.con": "gmail.com",
    "naver.con": "naver.com",
    "hanmail.con": "hanmail.net",
  };
  const [localPart, domain = ""] = email.split("@");
  const suggestedEmail = typoDomains[domain.toLowerCase()] ? `${localPart}@${typoDomains[domain.toLowerCase()]}` : "";

  function updateEmail(value: string) {
    setEmail(value);
    setVerificationSent(false);
    setEmailVerified(false);
    setEmailVerificationToken("");
    setCode("");
    setMessage("");
    setOrder(null);
    setPaymentReady(false);
    widgetsRef.current = null;
  }

  async function sendVerificationCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("이메일 주소를 다시 확인해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("인증번호 이메일을 보내고 있습니다.");
    try {
      const response = await fetch("/api/email/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, purpose: "checkout", turnstileToken: turnstileToken || undefined }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "인증번호를 보내지 못했습니다.");
      setVerificationSent(true);
      setMessage("인증번호를 이메일로 보냈습니다. 10분 안에 입력해 주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "인증번호를 보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    // 이메일로 받은 번호가 맞으면 서버가 발급한 확인 증표를 보관해 주문 생성 때 함께 보냅니다.
    if (!/^\d{6}$/.test(code)) {
      setMessage("이메일로 받은 6자리 인증번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/email/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = (await response.json()) as { verificationToken?: string; error?: string };
      if (!response.ok || !result.verificationToken) throw new Error(result.error ?? "이메일을 확인하지 못했습니다.");
      setEmailVerificationToken(result.verificationToken);
      setEmailVerified(true);
      setMessage("이메일 확인이 완료되었습니다.");
      sessionStorage.setItem(`pageport:checkout:${slug}:email`, email);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "이메일을 확인하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function createTestOrder() {
    // 이메일 확인과 두 가지 필수 안내 동의가 끝난 뒤에만 시험 주문번호를 만듭니다.
    if (!emailVerified || !confirmed || !refundAcknowledged) {
      setMessage("이메일 인증과 필수 확인 항목을 완료해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("시험 주문번호와 결제 화면을 만들고 있습니다.");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productSlug: slug, email, emailVerificationToken }),
      });
      const result = (await response.json()) as { order?: TestOrder; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error ?? "주문을 저장하지 못했습니다.");
      setOrder(result.order);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문을 저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function requestTestPayment() {
    // 토스가 결제를 마치면 성공 또는 실패 페이지로 화면 전체가 이동하도록 요청합니다.
    if (!order || !widgetsRef.current) return;
    setBusy(true);
    try {
      await widgetsRef.current.requestPayment({
        orderId: order.id,
        orderName: order.productTitle,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: order.buyerEmail,
        windowTarget: "self",
      });
    } catch (error) {
      const paymentError = error as { code?: string; message?: string };
      setMessage(
        paymentError.code === "USER_CANCEL"
          ? "결제를 취소했습니다. 다시 시도할 수 있습니다."
          : (paymentError.message ?? "결제창을 열지 못했습니다."),
      );
      setBusy(false);
    }
  }

  return (
    <div className="checkout-form">
      {/* 첫 단계에서는 이메일 인증과 구매·환불 안내 확인을 받습니다. */}
      {!order && (
        <>
          <label className="email-field">
            <span>구매 이메일</span>
            <div className="email-verify-row">
              <input
                value={email}
                onChange={(event) => updateEmail(event.target.value)}
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                required
                disabled={emailVerified}
              />
              <button
                type="button"
                disabled={busy}
                onClick={emailVerified ? () => updateEmail(email) : sendVerificationCode}
              >
                {emailVerified ? "이메일 수정" : verificationSent ? "다시 보내기" : "인증번호 받기"}
              </button>
            </div>
            <small>영수증과 다운로드 주소를 이 이메일로 보내드립니다.</small>
          </label>
          {suggestedEmail && !emailVerified && (
            <button className="email-suggestion" type="button" onClick={() => updateEmail(suggestedEmail)}>
              {suggestedEmail}을 입력하려고 하셨나요?
            </button>
          )}
          <TurnstileWidget onToken={setTurnstileToken} />
          {verificationSent && !emailVerified && (
            <div className="code-row">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="6자리 인증번호"
                aria-label="6자리 이메일 인증번호"
              />
              <button type="button" disabled={busy} onClick={verifyCode}>
                확인
              </button>
            </div>
          )}
          {emailVerified && <p className="verified-email">✓ 이메일 확인 완료</p>}
          <label className="check-row">
            <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
            <span>상품명, 가격, 이메일을 확인했습니다.</span>
          </label>
          <label className="check-row">
            <input
              checked={refundAcknowledged}
              onChange={(event) => setRefundAcknowledged(event.target.checked)}
              type="checkbox"
            />
            <span>다운로드 후에는 파일 오류나 설명 불일치 시에만 환불을 검토한다는 안내를 확인했습니다.</span>
          </label>
          <button className="buy-button" type="button" onClick={createTestOrder} disabled={busy}>
            {busy ? "준비 중…" : "시험 결제수단 열기"}
          </button>
        </>
      )}
      {order && (
        /* 주문이 만들어지면 이메일 입력 대신 토스 결제수단 선택 화면을 보여줍니다. */
        <div className="toss-payment-area">
          <p className="order-number">
            시험 주문번호 <b>{order.id}</b>
          </p>
          <div id="payment-method" />
          <div id="payment-agreement" />
          <button className="buy-button" type="button" onClick={requestTestPayment} disabled={!paymentReady || busy}>
            {paymentReady ? "토스로 시험 결제하기" : "결제 화면 불러오는 중…"}
          </button>
          <button className="payment-back" type="button" onClick={() => window.location.reload()}>
            주문 정보 다시 입력
          </button>
        </div>
      )}
      {message && (
        <p className="checkout-message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
