// PAGEPORT 이용 범위와 구매한 파일을 사용할 때 지켜야 할 기본 약속을 설명하는 페이지입니다.
import type { Metadata } from "next";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
export const metadata: Metadata = { title: "이용약관" };
export default function TermsPage() {
  return (
    <main>
      <SiteHeader />
      <article className="policy-page">
        <p className="eyebrow">이용약관</p>
        <h1>PAGEPORT 이용약관</h1>
        <p className="policy-notice">정식 판매 전 실제 사업자 정보와 법률 검토를 반영해 확정할 문서입니다.</p>
        <h2>서비스 이용</h2>
        <p>PAGEPORT는 디지털 PDF 상품의 정보 제공, 결제 확인, 파일 전달과 재다운로드 기능을 제공합니다.</p>
        <h2>구매와 파일 이용</h2>
        <p>구매자는 상품 설명과 이용 범위를 확인해야 하며, 받은 파일을 무단 복제·재판매·공개 배포할 수 없습니다.</p>
        <h2>서비스 변경</h2>
        <p>안전한 운영을 위해 기능을 점검하거나 변경할 수 있으며 중요한 변경은 서비스 화면으로 안내합니다.</p>
        <a className="text-link" href="/">
          홈으로 돌아가기
        </a>
      </article>
      <SiteFooter />
    </main>
  );
}
