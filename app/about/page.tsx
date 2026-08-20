// PAGEPORT를 구매하거나 검토하는 사람이 구매자·관리자 흐름을 한눈에 확인하는 서비스 검토 전용 페이지입니다.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "서비스 검토 안내 | PAGEPORT",
  description: "PAGEPORT의 구매자·관리자 화면과 이메일 인증, 결제, 다운로드 운영 구조를 확인하는 검토용 안내입니다.",
  robots: { index: false, follow: false },
};

const buyerSteps = [
  ["01", "PDF 선택", "카테고리와 상품 상세를 살펴보고 한 상품을 선택합니다."],
  ["02", "이메일 확인", "이메일로 받은 6자리 번호를 입력해 실제 사용자를 확인합니다."],
  ["03", "안전한 결제", "토스 결제 화면에서 카드 또는 간편결제를 진행합니다."],
  ["04", "즉시 다운로드", "결제가 확인되면 화면과 이메일에서 주문 전용 주소를 받습니다."],
  ["05", "구매내역 다시 확인", "같은 이메일을 다시 인증해 구매 상품을 찾고 새 주소를 받습니다."],
] as const;

const adminSteps = [
  ["01", "관리자 인증", "지정된 관리자 이메일과 6자리 번호로 운영 화면에 들어갑니다."],
  ["02", "상품 준비", "상품 정보와 PDF 원본을 등록하고 판매 전 내용을 확인합니다."],
  ["03", "상품 공개", "확인이 끝난 상품만 판매 중으로 바꿔 구매자 화면에 공개합니다."],
  ["04", "주문 확인", "결제 상태, 구매 이메일, 다운로드 횟수와 전달 상태를 확인합니다."],
  ["05", "환불 처리", "다운로드 여부를 확인하고 환불하면 기존 다운로드 주소도 함께 닫습니다."],
] as const;

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="review-header">
        <div className="review-header-title">
          <Link className="brand" href="/about" aria-label="페이지포트 서비스 검토 안내">
            PAGEPORT<span>.</span>
          </Link>
          <b>SERVICE REVIEW</b>
        </div>
        <p>
          <strong>검토용</strong> 일반 구매자 화면이 아닙니다.
        </p>
        <nav aria-label="검토 대상 화면">
          <Link href="/">구매자 화면 ↗</Link>
          <Link href="/admin">관리자 화면 ↗</Link>
        </nav>
      </header>

      <section className="review-context" aria-label="페이지 용도 안내">
        <strong>이 페이지는 서비스 확인을 위한 안내서입니다.</strong>
        <p>
          PAGEPORT의 구매·관리 구조를 검토하는 관계자를 위한 화면이며, PDF 구매는 아래 구매자 페이지에서 진행합니다.
        </p>
        <span>구매 기능 없음 · 검색 비노출</span>
      </section>

      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <p className="eyebrow">PAGEPORT SERVICE REVIEW BLUEPRINT</p>
          <h1 id="about-title">
            계정은 가볍게,
            <br />
            구매 기록은 <em>안전하게.</em>
          </h1>
          <p>
            PAGEPORT는 회원 아이디와 비밀번호를 만들지 않는 PDF 마켓입니다. 구매에 필요한 이메일만 확인하고, 결제와 파일
            전달에 필요한 최소한의 기록으로 구매부터 다시 받기까지 연결합니다.
          </p>
        </div>
        <aside className="about-principle-card" aria-label="PAGEPORT 운영 원칙">
          <span>01 / OPERATING PRINCIPLE</span>
          <strong>NO ACCOUNT</strong>
          <p>회원 프로필과 비밀번호 없이 이메일 인증을 임시 열쇠로 사용합니다.</p>
          <div>
            <small>계정·비밀번호</small>
            <b>만들지 않음</b>
          </div>
          <div>
            <small>구매자 확인</small>
            <b>이메일 6자리 인증</b>
          </div>
          <div>
            <small>카드번호·CVC</small>
            <b>PAGEPORT에 저장하지 않음</b>
          </div>
        </aside>
      </section>

      <section className="about-entrances" aria-labelledby="entrance-title">
        <div className="about-section-title">
          <p className="eyebrow">SCREENS TO REVIEW</p>
          <h2 id="entrance-title">검토할 실제 화면을 선택하세요.</h2>
          <p>
            아래 두 화면은 역할이 다릅니다. 구매자는 상품과 파일을 이용하고, 지정된 관리자는 상품·주문을 운영합니다.
          </p>
        </div>
        <div className="about-entrance-grid">
          <article className="about-entrance-card buyer">
            <span>REVIEW TARGET 01 · BUYER</span>
            <h3>구매자 페이지</h3>
            <p>PDF를 둘러보고 구매하거나, 이전에 구매한 파일을 이메일 인증으로 다시 받을 수 있습니다.</p>
            <div className="about-card-actions">
              <Link className="primary-button" href="/#products">
                PDF 상품 보기
              </Link>
              <Link className="text-link" href="/downloads/reissue">
                구매 파일 다시 받기
              </Link>
            </div>
          </article>
          <article className="about-entrance-card admin">
            <span>REVIEW TARGET 02 · ADMIN</span>
            <h3>관리자 페이지</h3>
            <p>운영자만 이메일 인증 후 상품 등록, 주문 확인, 다운로드 관리와 환불 처리를 할 수 있습니다.</p>
            <div className="about-card-actions">
              <Link className="primary-button light" href="/admin">
                관리자 화면 열기
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="about-process" aria-labelledby="process-title">
        <div className="about-section-title">
          <p className="eyebrow">HOW PAGEPORT WORKS</p>
          <h2 id="process-title">구매와 운영은 이렇게 이어집니다.</h2>
          <p>
            인증번호가 PDF를 직접 여는 것은 아닙니다. 인증번호는 이메일의 실제 사용자를 확인하고, 서버는 결제 완료
            주문까지 확인한 뒤 해당 상품의 다운로드 주소를 발급합니다.
          </p>
        </div>
        <div className="about-process-grid">
          <article className="about-process-column">
            <div className="about-process-heading">
              <span>구매자</span>
              <b>BUYER FLOW</b>
            </div>
            <ol>
              {buyerSteps.map(([number, title, description]) => (
                <li key={number}>
                  <b>{number}</b>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
          <article className="about-process-column admin-flow">
            <div className="about-process-heading">
              <span>관리자</span>
              <b>ADMIN FLOW</b>
            </div>
            <ol>
              {adminSteps.map(([number, title, description]) => (
                <li key={number}>
                  <b>{number}</b>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="about-data" aria-labelledby="data-title">
        <div className="about-data-copy">
          <p className="eyebrow">MINIMUM DATA, CLEAR PURPOSE</p>
          <h2 id="data-title">개인정보를 받지 않는 것이 아니라, 필요한 정보만 처리합니다.</h2>
          <p>
            이메일도 개인정보이므로 ‘개인정보를 전혀 수집하지 않는다’고 표현하지 않습니다. PAGEPORT는 구매 확인,
            영수증과 파일 전달, 재다운로드와 환불에 필요한 이메일·주문·다운로드 기록을 처리합니다.
          </p>
          <Link className="text-link" href="/privacy">
            개인정보 처리 내용 확인하기
          </Link>
        </div>
        <div className="about-data-grid">
          <div>
            <span>01</span>
            <strong>가입 정보 없음</strong>
            <p>구매자용 아이디, 비밀번호와 회원 프로필을 만들지 않습니다.</p>
          </div>
          <div>
            <span>02</span>
            <strong>이메일이 임시 열쇠</strong>
            <p>구매와 재다운로드가 필요할 때만 6자리 번호로 이메일을 확인합니다.</p>
          </div>
          <div>
            <span>03</span>
            <strong>결제정보 분리</strong>
            <p>카드번호와 CVC는 결제 전문회사에서 처리하며 PAGEPORT가 저장하지 않습니다.</p>
          </div>
        </div>
      </section>

      <section className="about-status" aria-labelledby="status-title">
        <div>
          <p className="eyebrow">CURRENT STATUS</p>
          <h2 id="status-title">지금은 1차 시험 운영 단계입니다.</h2>
        </div>
        <ul>
          <li>현재 결제는 토스페이먼츠 시험 모드이며 실제 금액이 청구되지 않습니다.</li>
          <li>1차에는 PAGEPORT 운영 상품만 판매하고 사업자 판매자 입점은 2차에서 준비합니다.</li>
          <li>실제 운영 전 사업자 정보, 개인정보 보관 기간, 고객지원 주소와 정책을 확정합니다.</li>
        </ul>
      </section>

      <footer className="review-footer">
        <div>
          <strong>PAGEPORT SERVICE REVIEW</strong>
          <p>구매자 화면과 관리자 화면의 연결 구조를 확인하기 위한 비공개 검색 검토 페이지입니다.</p>
        </div>
        <Link href="/">구매자 홈으로 돌아가기 →</Link>
      </footer>
    </main>
  );
}
