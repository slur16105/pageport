// 주소의 영문 상품명(slug)에 맞는 상품을 찾아 상세 정보와 구매 시작 화면을 보여주는 페이지입니다.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "../../../components/StructuredData";
import { getPublishedProduct } from "../../../lib/catalog-products";
import { PurchaseForm } from "./PurchaseForm";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  // 검색 결과나 공유 카드에 상품명이 자연스럽게 보이도록 페이지 제목과 설명을 만듭니다.
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) return {};
  // 브라우저 제목에는 최상위 레이아웃이 자동으로 “| PAGEPORT”를 붙이므로 상품명만 전달합니다.
  const title = product.title;
  const socialTitle = `${product.title} | PAGEPORT`;
  const description = `${product.seller}의 ${product.description}. ${product.price}`;
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: socialTitle,
      description,
      type: "website",
      locale: "ko_KR",
      siteName: "PAGEPORT",
      url: `/products/${product.slug}`,
    },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // 공개 판매 중인 상품이 없으면 잘못된 주소로 보고 404 안내 화면을 보여줍니다.
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const productUrl = `${appUrl}/products/${product.slug}`;
  const numericPrice = product.price.replace(/[^0-9]/g, "");

  return (
    <main>
      {/* 화면의 상품 정보와 같은 내용을 기계용 상품·가격·경로 정보로도 제공합니다. */}
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.summary,
            category: product.category,
            sku: product.slug,
            image: [`${productUrl}/opengraph-image`],
            brand: { "@type": "Brand", name: "PAGEPORT" },
            offers: {
              "@type": "Offer",
              url: productUrl,
              priceCurrency: "KRW",
              price: numericPrice,
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: product.seller },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "PAGEPORT", item: appUrl },
              { "@type": "ListItem", position: 2, name: product.category, item: `${appUrl}/#products` },
              { "@type": "ListItem", position: 3, name: product.title, item: productUrl },
            ],
          },
        ]}
      />
      {/* 상세 화면에서 상품 목록·구매 안내·내 구매함으로 이동하는 상단 메뉴입니다. */}
      <header className="site-header detail-header">
        <a className="brand" href="/" aria-label="페이지포트 홈">
          PAGEPORT<span>.</span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="/#products">PDF 둘러보기</a>
          <a href="/#guide">이용 방법</a>
          <a href="/#faq">구매 안내</a>
        </nav>
        <a className="header-button" href="/downloads/reissue">
          내 구매함
        </a>
      </header>

      <div className="detail-shell">
        {/* 상품 미리보기와 가격을 확인한 뒤 이메일을 입력해 구매를 시작하는 핵심 영역입니다. */}
        <div className="breadcrumb">
          <a href="/">홈</a>
          <span>›</span>
          <a href="/#products">{product.category}</a>
          <span>›</span>
          <b>상품 상세</b>
        </div>

        <section className="detail-top">
          <div className="preview-gallery" aria-label="상품 미리보기 3장">
            <div className={`detail-preview preview-cover ${product.accent}`}>
              <small>{product.category}</small>
              <strong>{product.mark}</strong>
              <p>{product.title}</p>
              <i>PAGEPORT PREVIEW</i>
            </div>
            <div className="detail-preview preview-inside">
              <small>01 · WEEKLY PLAN</small>
              <strong>이번 주 가장 중요한 일은?</strong>
              <div className="preview-rule" />
              <div className="preview-checks">
                □ PRIORITY 1<br />□ PRIORITY 2<br />□ PRIORITY 3
              </div>
              <i>PAGEPORT PREVIEW</i>
            </div>
            <div className="detail-preview preview-inside second">
              <small>02 · REVIEW</small>
              <strong>한 주를 가볍게 돌아보기</strong>
              <div className="preview-grid" />
              <i>PAGEPORT PREVIEW</i>
            </div>
          </div>

          <aside className="purchase-panel">
            <span className="test-badge">토스페이먼츠 시험 결제 · 실제 청구 안 됨</span>
            <p className="product-category">{product.category}</p>
            <h1>{product.title}</h1>
            <a className="seller-name" href="#seller">
              판매자 {product.seller} ↗
            </a>
            <p className="detail-description">{product.summary}</p>
            <div className="file-facts">
              <span>PDF {product.pages}쪽</span>
              <span>{product.fileSize}</span>
              <span>즉시 다운로드</span>
            </div>
            <div className="detail-price">
              <span>판매가</span>
              <strong>{product.price}</strong>
            </div>
            <PurchaseForm slug={product.slug} />
            <p className="purchase-note">카드·간편결제 시험 가능 · 회원가입 없이 구매 · 결제 후 즉시 다운로드</p>
          </aside>
        </section>

        <section className="detail-content">
          {/* 상품 구성, 사용법, 환불 전 확인사항을 구매 전에 이해하기 쉽게 안내합니다. */}
          <div className="content-main">
            <p className="eyebrow">상품 구성</p>
            <h2>이 PDF에 들어 있어요</h2>
            <div className="include-grid">
              {product.includes.map((item, index) => (
                <div key={item}>
                  <b>0{index + 1}</b>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="description-block">
              <p className="eyebrow">사용 안내</p>
              <h2>인쇄하거나 태블릿에서 사용하세요</h2>
              <p>
                A4 크기에 맞춰 제작된 PDF입니다. 집이나 사무실에서 출력하거나 필기 앱으로 불러와 사용할 수 있습니다.
                구매 후 이메일 인증을 거치면 횟수 제한 없이 다시 받을 수 있습니다.
              </p>
            </div>
          </div>
          <aside className="policy-card">
            <h3>구매 전 확인</h3>
            <ul>
              <li>디지털 상품으로 배송되지 않습니다.</li>
              <li>다운로드 주소는 24시간 또는 5회 다운로드 후 만료됩니다.</li>
              <li>만료 후 이메일 인증으로 다시 받을 수 있습니다.</li>
              <li>다운로드 후 단순 변심 환불은 어렵습니다.</li>
            </ul>
          </aside>
        </section>
      </div>

      <footer>
        <a className="brand" href="/">
          PAGEPORT<span>.</span>
        </a>
        <p>전문 지식이 오가는 디지털 문서 마켓</p>
        <div>
          <a href="/#faq">이용 안내</a>
          <a href="/#sell">판매자 입점</a>
          <a href="mailto:hello@pageport.example">문의하기</a>
        </div>
        <small>현재 상품은 출시 준비용 샘플이며 토스 시험 환경에서는 실제 금액이 청구되지 않습니다.</small>
      </footer>
    </main>
  );
}
