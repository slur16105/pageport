import { listPublishedProducts } from "../lib/catalog-products";

const categories = ["전체", "업무·생산성", "공부·교육", "디자인", "돈관리", "생활", "취미"];

const creators = [
  { initials: "정", name: "정리의기술", role: "업무 템플릿 크리에이터", count: "PDF 12개", color: "mint" },
  { initials: "모", name: "머니소소", role: "생활 금융 콘텐츠 작가", count: "PDF 8개", color: "yellow" },
  { initials: "스", name: "스튜디오모브", role: "브랜드 디자이너", count: "PDF 15개", color: "pink" },
];

export default async function Home() {
  const products = await listPublishedProducts();
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="페이지포트 홈">PAGEPORT<span>.</span></a>
        <nav aria-label="주요 메뉴"><a href="#products">PDF 둘러보기</a><a href="#creators">판매자 이야기</a><a href="#sell">판매자 입점</a></nav>
        <button className="header-button" type="button">내 구매함</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">검증된 디지털 문서 마켓플레이스</p>
          <h1>전문 지식이,<br /><em>새로운 기회로.</em></h1>
          <p className="hero-description">일과 공부, 생활에 바로 쓰는 PDF를 발견하세요. 나만의 노하우가 담긴 문서가 있다면 판매자가 되어 새로운 수익도 만들 수 있어요.</p>
          <div className="hero-actions"><a className="primary-button" href="#products">인기 PDF 둘러보기</a><a className="text-link" href="#sell">PDF 판매 시작하기 <span>→</span></a></div>
          <div className="trust-row" aria-label="서비스 장점"><span>✓ 다양한 창작자의 PDF</span><span>✓ 결제 즉시 다운로드</span><span>✓ 판매자 정산 지원</span></div>
        </div>
        <div className="hero-art" aria-label="페이지포트 PDF 상품 미리보기">
          <div className="sun-shape" /><div className="paper paper-back"><small>MONTHLY</small><strong>08</strong><div className="paper-lines" /></div>
          <div className="paper paper-front"><div className="paper-brand">PAGEPORT</div><p>WEEKLY<br />FOCUS</p><span>Made by creators.<br />Ready for you.</span><div className="paper-grid" /></div><div className="scribble">✦</div>
        </div>
      </section>

      <section className="category-bar" aria-label="상품 카테고리">
        {categories.map((category, index) => <button className={index === 0 ? "active" : ""} type="button" key={category}>{category}</button>)}
      </section>

      <section className="products-section" id="products">
        <div className="section-heading"><div><p className="eyebrow">지금 많이 찾는 PDF</p><h2>크리에이터의 베스트셀러</h2></div><a href="#products">전체 상품 보기 →</a></div>
        <div className="product-grid">{products.map((product) => (
          <a className="product-card" href={`/products/${product.slug}`} key={product.title}>
            <div className={`product-cover ${product.accent}`}><span>{product.category}</span><b>{product.mark}</b><div className="cover-lines" /></div>
            <div className="product-info"><small>{product.seller} · ★ {product.rating} ({product.reviews})</small><h3>{product.title}</h3><p>{product.description}</p><div className="price-row"><strong>{product.price}</strong><span aria-hidden="true">→</span></div></div>
          </a>
        ))}</div>
      </section>

      <section className="creators-section" id="creators">
        <div className="section-heading"><div><p className="eyebrow">사람이 만드는 마켓</p><h2>이번 주 주목할 판매자</h2></div><a href="#sell">나도 판매하기 →</a></div>
        <div className="creator-grid">{creators.map((creator) => (
          <article className="creator-card" key={creator.name}><div className={`creator-avatar ${creator.color}`}>{creator.initials}</div><div><h3>{creator.name}</h3><p>{creator.role}</p><small>{creator.count} · 팔로우</small></div><span>↗</span></article>
        ))}</div>
      </section>

      <section className="how-section" id="guide">
        <div className="how-title"><p className="eyebrow">회원가입 없이도 가능해요</p><h2>이메일 하나로<br />구매하고 다시 받아요</h2></div>
        <div className="steps">
          <div><b>01</b><h3>이메일 입력</h3><p>구매 영수증과 다운로드 주소를 받을 이메일을 입력해요.</p></div>
          <div><b>02</b><h3>카드·간편결제</h3><p>결제 전문회사의 안전한 창에서 카드나 간편결제로 결제해요.</p></div>
          <div><b>03</b><h3>즉시 다운로드</h3><p>결제가 확인되면 화면과 이메일에 한시적인 다운로드 주소가 생겨요.</p></div>
          <div><b>04</b><h3>다시 받기</h3><p>이메일 인증을 거치면 이전 구매 파일을 다시 받을 수 있어요.</p></div>
        </div>
      </section>

      <section className="seller-section" id="sell">
        <div className="seller-copy"><p className="eyebrow">당신의 노하우도 상품이 됩니다</p><h2>PDF 한 파일로<br />판매를 시작하세요.</h2><p>상품 등록, 결제, 안전한 파일 전달, 판매 내역과 정산 확인까지 페이지포트가 한곳에서 도와드려요.</p><a className="primary-button light" href="mailto:seller@pageport.example">판매자 입점 신청</a></div>
        <div className="seller-board"><div><span>이번 달 판매</span><strong>128건</strong></div><div><span>예상 정산금</span><strong>842,600원</strong></div><div className="bar-chart"><i /><i /><i /><i /><i /><i /></div><small>판매자 화면 예시 · 실제 데이터가 아닙니다</small></div>
      </section>

      <section className="faq-section" id="faq">
        <p className="eyebrow">자주 묻는 질문</p><h2>구매 전에 확인해 주세요</h2>
        <div className="faq-list"><details><summary>회원가입을 꼭 해야 하나요?</summary><p>아니요. 구매용 이메일만 입력하면 결제와 다운로드가 가능합니다. 판매자는 상품과 정산 관리를 위해 가입이 필요합니다.</p></details><details><summary>PDF는 어디서 받을 수 있나요?</summary><p>결제 완료 화면에서 바로 받을 수 있고, 입력한 이메일로도 다운로드 안내를 보내드립니다.</p></details><details><summary>판매대금은 어떻게 받나요?</summary><p>플랫폼 수수료와 환불 등을 반영한 금액을 정해진 주기에 등록한 판매자 계좌로 지급하는 구조를 준비합니다.</p></details></div>
      </section>

      <footer><a className="brand" href="#top">PAGEPORT<span>.</span></a><p>전문 지식이 오가는 디지털 문서 마켓</p><div><a href="#faq">이용 안내</a><a href="#sell">판매자 입점</a><a href="mailto:hello@pageport.example">문의하기</a></div><small>현재 화면은 서비스 기획용 샘플이며 실제 결제는 진행되지 않습니다.</small></footer>
    </main>
  );
}
