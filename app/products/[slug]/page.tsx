import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "../../../lib/catalog-products";
import { PurchaseForm } from "./PurchaseForm";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) return {};
  const title = `${product.title} | PAGEPORT`;
  const description = `${product.seller}의 ${product.description}. ${product.price}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { card: "summary", title, description, images: [] },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  return (
    <main>
      <header className="site-header detail-header">
        <a className="brand" href="/" aria-label="페이지포트 홈">PAGEPORT<span>.</span></a>
        <nav aria-label="주요 메뉴"><a href="/#products">PDF 둘러보기</a><a href="/#guide">이용 방법</a><a href="/#faq">구매 안내</a></nav>
        <button className="header-button" type="button">내 구매함</button>
      </header>

      <div className="detail-shell">
        <div className="breadcrumb"><a href="/">홈</a><span>›</span><a href="/#products">{product.category}</a><span>›</span><b>상품 상세</b></div>

        <section className="detail-top">
          <div className="preview-gallery" aria-label="상품 미리보기 3장">
            <div className={`detail-preview preview-cover ${product.accent}`}>
              <small>{product.category}</small><strong>{product.mark}</strong><p>{product.title}</p><i>PAGEPORT PREVIEW</i>
            </div>
            <div className="detail-preview preview-inside"><small>01 · WEEKLY PLAN</small><strong>이번 주 가장 중요한 일은?</strong><div className="preview-rule" /><div className="preview-checks">□ PRIORITY 1<br />□ PRIORITY 2<br />□ PRIORITY 3</div><i>PAGEPORT PREVIEW</i></div>
            <div className="detail-preview preview-inside second"><small>02 · REVIEW</small><strong>한 주를 가볍게 돌아보기</strong><div className="preview-grid" /><i>PAGEPORT PREVIEW</i></div>
          </div>

          <aside className="purchase-panel">
            <span className="test-badge">시험용 화면 · 실제 결제 안 됨</span>
            <p className="product-category">{product.category}</p>
            <h1>{product.title}</h1>
            <a className="seller-name" href="#seller">판매자 {product.seller} ↗</a>
            <div className="rating-line"><b>★ {product.rating}</b><span>구매 후기 {product.reviews}개</span></div>
            <p className="detail-description">{product.summary}</p>
            <div className="file-facts"><span>PDF {product.pages}쪽</span><span>{product.fileSize}</span><span>즉시 다운로드</span></div>
            <div className="detail-price"><span>판매가</span><strong>{product.price}</strong></div>
            <PurchaseForm slug={product.slug} />
            <p className="purchase-note">카드·간편결제 예정 · 회원가입 없이 구매 · 결제 후 즉시 다운로드</p>
          </aside>
        </section>

        <section className="detail-content">
          <div className="content-main">
            <p className="eyebrow">상품 구성</p><h2>이 PDF에 들어 있어요</h2>
            <div className="include-grid">{product.includes.map((item, index) => <div key={item}><b>0{index + 1}</b><span>{item}</span></div>)}</div>
            <div className="description-block"><p className="eyebrow">사용 안내</p><h2>인쇄하거나 태블릿에서 사용하세요</h2><p>A4 크기에 맞춰 제작된 PDF입니다. 집이나 사무실에서 출력하거나 필기 앱으로 불러와 사용할 수 있습니다. 구매 후 이메일 인증을 거치면 횟수 제한 없이 다시 받을 수 있습니다.</p></div>
          </div>
          <aside className="policy-card"><h3>구매 전 확인</h3><ul><li>디지털 상품으로 배송되지 않습니다.</li><li>다운로드 주소는 24시간 또는 5회 다운로드 후 만료됩니다.</li><li>만료 후 이메일 인증으로 다시 받을 수 있습니다.</li><li>다운로드 후 단순 변심 환불은 어렵습니다.</li></ul></aside>
        </section>

        <section className="review-section">
          <div><p className="eyebrow">실제 구매자 후기</p><h2>★ {product.rating} <small>/ 5.0</small></h2></div>
          <div className="review-card"><div><b>일주일이 정말 정리됐어요</b><span>★★★★★</span></div><p>계획을 복잡하게 세우는 편이었는데 꼭 필요한 내용만 있어서 바로 사용할 수 있었습니다. 태블릿 필기 앱에서도 잘 열려요.</p><small>구매 인증 후기 · 김** · 2026.08</small></div>
        </section>
      </div>

      <footer><a className="brand" href="/">PAGEPORT<span>.</span></a><p>전문 지식이 오가는 디지털 문서 마켓</p><div><a href="/#faq">이용 안내</a><a href="/#sell">판매자 입점</a><a href="mailto:hello@pageport.example">문의하기</a></div><small>현재 화면은 서비스 기획용 샘플이며 실제 결제는 진행되지 않습니다.</small></footer>
    </main>
  );
}
