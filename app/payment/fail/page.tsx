import type { Metadata } from "next";

export const metadata: Metadata = { title: "시험 결제 실패 | PAGEPORT", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ code?: string; message?: string; orderId?: string }> };

export default async function PaymentFailPage({ searchParams }: Props) {
  const params = await searchParams;
  const canceled = params.code === "PAY_PROCESS_CANCELED";
  return (
    <main className="payment-result-page">
      <section className="payment-result-card error">
        <span className="test-badge">토스페이먼츠 시험 결제</span>
        <div className="result-icon">!</div>
        <h1>{canceled ? "결제를 취소했습니다" : "결제를 완료하지 못했습니다"}</h1>
        <p>{canceled ? "실제 돈은 청구되지 않았습니다. 상품 페이지에서 다시 시도할 수 있습니다." : params.message ?? "잠시 후 다시 시도해 주세요."}</p>
        {params.orderId && <small>주문번호 {params.orderId}</small>}
        <a className="primary-button" href="/">상품 목록으로 돌아가기</a>
      </section>
    </main>
  );
}
