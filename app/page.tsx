// PAGEPORT 첫 화면으로, 서비스 소개부터 상품 탐색·구매 방법·판매자 안내·FAQ까지 한 흐름으로 보여줍니다.
import type { Metadata } from "next";
import { listPublishedProducts } from "../lib/catalog-products";
import { ProductCatalog } from "../components/ProductCatalog";
import { HeroSection } from "../components/HeroSection";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { StructuredData } from "../components/StructuredData";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const faqItems = [
  {
    question: "회원가입 없이 어떻게 이용하나요?",
    answer:
      "상품을 고른 뒤 구매 이메일로 받은 6자리 인증번호를 입력하고 결제합니다. 아이디와 비밀번호는 만들지 않습니다.",
  },
  {
    question: "구매한 PDF는 어디서 받나요?",
    answer: "결제 완료 화면에서 바로 받을 수 있고, 입력한 이메일로도 다운로드 안내를 보내드립니다.",
  },
  {
    question: "구매내역은 어떻게 확인하나요?",
    answer:
      "‘파일 다시 받기’에서 구매 이메일을 인증하면 해당 이메일로 결제한 상품 목록을 확인할 수 있습니다. 주문번호는 외울 필요가 없습니다.",
  },
  {
    question: "다운로드 주소가 만료되면 다시 결제해야 하나요?",
    answer:
      "아닙니다. 주소는 24시간 또는 5회 다운로드 후 만료되지만, 구매 이메일을 다시 인증하면 새 주소를 받을 수 있습니다.",
  },
  {
    question: "구매 이메일을 잘못 입력했다면 어떻게 하나요?",
    answer:
      "결제 전에는 이메일을 수정할 수 있습니다. 결제 후에는 구매 기록을 자동으로 다른 이메일에 옮길 수 없으므로 고객지원을 통한 확인이 필요합니다.",
  },
  {
    question: "환불은 어떻게 하나요?",
    answer:
      "다운로드 전에는 단순 변심 환불이 가능하며, 다운로드 후에는 파일 오류나 설명 불일치를 확인한 뒤 처리합니다.",
  },
];

export default async function Home() {
  // 데이터베이스에서 현재 판매 중인 상품만 가져와 카테고리 필터가 있는 상품 목록에 전달합니다.
  const products = await listPublishedProducts();
  return (
    <main>
      {/* 상단 소개와 상품 목록 다음에 구매 순서를 처음 방문한 사용자 눈높이로 설명합니다. */}
      <SiteHeader />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <HeroSection />

      <ProductCatalog products={products} />

      <section className="how-section" id="guide">
        <div className="how-title">
          <p className="eyebrow">회원가입 없이도 가능해요</p>
          <h2>
            이메일 하나로
            <br />
            구매하고 다시 받아요
          </h2>
        </div>
        <div className="steps">
          <div>
            <b>01</b>
            <h3>이메일 입력</h3>
            <p>구매 영수증과 다운로드 주소를 받을 이메일을 입력해요.</p>
          </div>
          <div>
            <b>02</b>
            <h3>카드·간편결제</h3>
            <p>결제 전문회사의 안전한 창에서 카드나 간편결제로 결제해요.</p>
          </div>
          <div>
            <b>03</b>
            <h3>즉시 다운로드</h3>
            <p>결제가 확인되면 화면과 이메일에 한시적인 다운로드 주소가 생겨요.</p>
          </div>
          <div>
            <b>04</b>
            <h3>다시 받기</h3>
            <p>이메일 인증을 거치면 이전 구매 파일을 다시 받을 수 있어요.</p>
          </div>
        </div>
      </section>

      <section className="seller-section" id="sell">
        {/* 판매자 입점은 아직 시작 전임을 분명히 밝히고, 2차 출시 예정 정책만 미리 안내합니다. */}
        <div className="seller-copy">
          <p className="eyebrow">판매자 기능은 2차 출시 예정</p>
          <h2>
            사업자 파트너 입점을
            <br />
            준비하고 있어요
          </h2>
          <p>
            현재는 PAGEPORT 운영 상품만 판매합니다. 사업자 확인, 상품 검수, 수수료 15%, 월 2회 정산 기능을 충분히 준비한
            뒤 파트너 입점을 시작합니다.
          </p>
          <span className="primary-button light">아직 신청을 받지 않습니다</span>
        </div>
        <div className="seller-board">
          <div>
            <span>입점 대상</span>
            <strong>사업자 판매자</strong>
          </div>
          <div>
            <span>상품 공개</span>
            <strong>운영자 검수 후</strong>
          </div>
          <div>
            <span>예정 수수료</span>
            <strong>15%</strong>
          </div>
          <div>
            <span>예정 정산</span>
            <strong>월 2회</strong>
          </div>
          <small>정책과 기능 준비가 끝난 뒤 별도로 안내합니다.</small>
        </div>
      </section>

      <section className="faq-section" id="faq">
        {/* 결제 전에 자주 생기는 걱정을 펼쳐보는 질문과 답변으로 정리합니다. */}
        <p className="eyebrow">자주 묻는 질문</p>
        <h2>구매 전에 확인해 주세요</h2>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
