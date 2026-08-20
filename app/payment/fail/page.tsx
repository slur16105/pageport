// 사용자가 결제를 취소했거나 결제사에서 실패한 경우 이유와 다시 돌아갈 길을 보여주는 페이지입니다.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "시험 결제 실패 | PAGEPORT", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ code?: string; message?: string; orderId?: string }> };

export default async function PaymentFailPage({ searchParams }: Props) {
  // 직접 취소한 경우와 오류로 실패한 경우를 나누어 불안하지 않도록 다른 문구를 보여줍니다.
  const params = await searchParams;
  const canceled = params.code === "PAY_PROCESS_CANCELED";
  return (
    <main className="payment-result-page">
      <section className="payment-result-card error">
        <span className="test-badge">토스페이먼츠 시험 결제</span>
        <div className="result-icon">!</div>
        <h1>{canceled ? "결제를 취소했습니다" : "결제를 완료하지 못했습니다"}</h1>
        <p>
          {canceled
            ? "실제 돈은 청구되지 않았습니다. 상품 페이지에서 다시 시도할 수 있습니다."
            : (params.message ?? "잠시 후 다시 시도해 주세요.")}
        </p>
        {params.orderId && <small>주문번호 {params.orderId}</small>}
        <a className="primary-button" href="/">
          상품 목록으로 돌아가기
        </a>
      </section>
    </main>
  );
}
