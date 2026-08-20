import { listPublishedProducts } from "../lib/catalog-products";
import { ProductCatalog } from "../components/ProductCatalog";
import { HeroSection } from "../components/HeroSection";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listPublishedProducts();
  return (
    <main>
      <SiteHeader />

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
        <div className="seller-copy">
          <p className="eyebrow">2차 출시에서 준비합니다</p>
          <h2>
            사업자 판매자
            <br />
            입점 준비 중
          </h2>
          <p>
            1차에는 PAGEPORT 운영 상품만 판매합니다. 이후 사업자 확인, 상품 검수, 수수료 15%, 월 2회 정산 기능을 갖춰
            입점을 시작합니다.
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
        <p className="eyebrow">자주 묻는 질문</p>
        <h2>구매 전에 확인해 주세요</h2>
        <div className="faq-list">
          <details>
            <summary>회원가입을 꼭 해야 하나요?</summary>
            <p>아니요. 구매용 이메일만 확인하면 결제와 다운로드가 가능합니다.</p>
          </details>
          <details>
            <summary>PDF는 어디서 받을 수 있나요?</summary>
            <p>결제 완료 화면에서 바로 받을 수 있고, 입력한 이메일로도 다운로드 안내를 보내드립니다.</p>
          </details>
          <details>
            <summary>주소가 만료되면 다시 결제해야 하나요?</summary>
            <p>아니요. 구매 이메일을 다시 인증하면 새 다운로드 주소를 받을 수 있습니다.</p>
          </details>
          <details>
            <summary>환불은 어떻게 하나요?</summary>
            <p>
              다운로드 전에는 단순 변심 환불이 가능하며, 다운로드 후에는 파일 오류나 설명 불일치를 확인한 뒤 처리합니다.
            </p>
          </details>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
