"use client";

// 토스 결제에서 돌아온 뒤 서버에 최종 승인을 요청하고, 성공하면 PDF 다운로드 버튼을 보여주는 화면입니다.

import { useEffect, useState } from "react";

type PaymentParams = { paymentKey: string; orderId: string; amount: number };

export function PaymentSuccess({ payment }: { payment: PaymentParams | null }) {
  // 확인 중·완료·실패 중 현재 단계를 기억해 사용자에게 알맞은 안내를 보여줍니다.
  const [status, setStatus] = useState<"confirming" | "success" | "error">(payment ? "confirming" : "error");
  const [message, setMessage] = useState(
    payment ? "주문 금액을 확인하고 시험 결제를 승인하고 있습니다." : "결제 결과 정보가 올바르지 않습니다.",
  );
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    if (!payment) return;
    window.history.replaceState(window.history.state, "", window.location.pathname);
    let active = true;
    async function confirmPayment() {
      // 브라우저가 받은 결제 정보를 서버가 다시 확인해야 실제로 완료된 주문으로 처리됩니다.
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payment),
        });
        const result = (await response.json()) as { error?: string; downloadUrl?: string; emailSent?: boolean };
        if (!response.ok) throw new Error(result.error ?? "시험 결제를 승인하지 못했습니다.");
        if (active) {
          setStatus("success");
          setDownloadUrl(result.downloadUrl ?? "");
          setMessage(
            result.emailSent
              ? "시험 결제가 완료되었고 구매 이메일로도 다운로드 주소를 보냈습니다. 아래 주소는 24시간 또는 5회 다운로드까지 사용할 수 있습니다."
              : "시험 결제는 완료되었습니다. 이메일 발송이 잠시 지연되고 있으니 이 화면의 다운로드 버튼을 먼저 이용해 주세요.",
          );
        }
      } catch (error) {
        if (active) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "시험 결제를 승인하지 못했습니다.");
        }
      }
    }
    confirmPayment();
    return () => {
      active = false;
    };
  }, [payment]);

  return (
    <main className="payment-result-page">
      <section className={`payment-result-card ${status}`}>
        <span className="test-badge">토스페이먼츠 시험 결제</span>
        <div className="result-icon">{status === "confirming" ? "…" : status === "success" ? "✓" : "!"}</div>
        <h1>{status === "confirming" ? "결제 확인 중" : status === "success" ? "시험 결제 완료" : "결제 확인 실패"}</h1>
        <p>{message}</p>
        {payment?.orderId && <small>주문번호 {payment.orderId}</small>}
        {status === "success" && downloadUrl && (
          <a className="download-button" href={downloadUrl}>
            PDF 다운로드
          </a>
        )}
        {status === "success" && (
          <a className="result-home-link" href="/downloads/reissue">
            다운로드 주소 다시 받기
          </a>
        )}
        <a className="result-home-link" href="/">
          상품 목록으로 돌아가기
        </a>
      </section>
    </main>
  );
}
