import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "../../../lib/catalog-products";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "주문 확인 | PAGEPORT",
  description: "페이지포트 주문 정보를 확인합니다.",
  robots: { index: false, follow: false },
};

type CheckoutPageProps = { params: Promise<{ slug: string }> };

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  return (
    <main className="checkout-page">
      <header className="site-header detail-header">
        <a className="brand" href="/" aria-label="페이지포트 홈">
          PAGEPORT<span>.</span>
        </a>
        <span className="checkout-step">주문 확인</span>
        <a className="header-button" href={`/products/${product.slug}`}>
          상품으로 돌아가기
        </a>
      </header>
      <section className="checkout-shell">
        <div className="checkout-copy">
          <p className="eyebrow">마지막 확인 단계</p>
          <h1>
            주문 내용을
            <br />
            확인해 주세요.
          </h1>
          <p>
            이메일과 상품 정보를 확인하면 토스페이먼츠 시험 결제수단이 열립니다. 시험용 키만 사용하므로 실제 돈은
            결제되지 않습니다.
          </p>
        </div>
        <div className="checkout-card">
          <span className="test-badge">시험용 주문 · 실제 결제 안 됨</span>
          <div className="checkout-product">
            <div className={`checkout-cover ${product.accent}`}>
              <b>{product.mark}</b>
              <i>PDF</i>
            </div>
            <div>
              <small>{product.seller}</small>
              <h2>{product.title}</h2>
              <p>
                PDF {product.pages}쪽 · {product.fileSize}
              </p>
            </div>
          </div>
          <div className="checkout-total">
            <span>결제 예정 금액</span>
            <strong>{product.price}</strong>
          </div>
          <CheckoutForm slug={product.slug} />
          <p className="secure-note">
            카드번호는 PAGEPORT에 저장되지 않으며, 토스페이먼츠의 안전한 화면에서만 처리됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
