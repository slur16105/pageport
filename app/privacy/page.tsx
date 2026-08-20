import type { Metadata } from "next";
export const metadata: Metadata = { title: "개인정보처리방침" };
export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <a className="brand" href="/">
        PAGEPORT<span>.</span>
      </a>
      <p className="eyebrow">개인정보처리방침</p>
      <h1>개인정보를 이렇게 다룹니다</h1>
      <p className="policy-notice">정식 판매 전 사업자 정보, 보관 기간, 국외 처리 내용을 전문가 검토 후 확정합니다.</p>
      <h2>수집 정보</h2>
      <p>
        구매·파일 전달·환불을 위해 이메일, 주문번호, 상품, 금액, 결제 상태와 다운로드 기록을 처리합니다. 카드번호와
        CVC는 PAGEPORT가 저장하지 않습니다.
      </p>
      <h2>이용 목적</h2>
      <p>이메일 확인, 결제·환불 확인, 구매 파일 전달, 고객 문의와 부정 이용 방지에 사용합니다.</p>
      <h2>외부 서비스</h2>
      <p>결제는 토스페이먼츠, 이메일은 Resend, 데이터와 파일은 Supabase, 호스팅은 Vercel을 사용합니다.</p>
      <a className="text-link" href="/">
        홈으로 돌아가기
      </a>
    </main>
  );
}
