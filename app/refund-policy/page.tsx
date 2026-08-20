// 디지털 상품을 다운로드하기 전과 후의 환불 기준을 구매자에게 안내하는 페이지입니다.
import type { Metadata } from "next";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
export const metadata: Metadata = { title: "환불 안내" };
export default function RefundPolicyPage() {
  return (
    <main>
      <SiteHeader />
      <article className="policy-page">
        <p className="eyebrow">환불 안내</p>
        <h1>다운로드 전과 후의 기준이 달라요</h1>
        <h2>다운로드 전</h2>
        <p>단순 변심으로 전액 환불을 요청할 수 있습니다.</p>
        <h2>다운로드 후</h2>
        <p>
          디지털 상품의 특성상 단순 변심 환불은 어렵습니다. 다만 파일 오류나 상품 설명과 실제 내용이 다른 경우 확인 후
          전액 환불합니다.
        </p>
        <h2>처리 방법</h2>
        <p>
          고객지원 이메일로 주문 이메일과 주문번호, 사유를 보내면 영업일 기준 2일 이내 답변합니다. 환불 완료 즉시 기존
          다운로드 주소는 닫힙니다.
        </p>
        <a className="text-link" href="/">
          홈으로 돌아가기
        </a>
      </article>
      <SiteFooter />
    </main>
  );
}
