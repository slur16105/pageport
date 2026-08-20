// 여러 페이지 아래에 반복해서 쓰는 공통 푸터로, 정책과 재다운로드 메뉴를 한곳에 제공합니다.
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer role="contentinfo">
      <Link className="brand" href="/#top" aria-label="페이지포트 홈">
        PAGEPORT<span>.</span>
      </Link>
      <p>전문 지식이 오가는 디지털 문서 마켓</p>
      <div>
        <Link href="/about">서비스 소개</Link>
        <Link href="/terms">이용약관</Link>
        <Link href="/privacy">개인정보처리방침</Link>
        <Link href="/refund-policy">환불 안내</Link>
        <Link href="/downloads/reissue">파일 다시 받기</Link>
      </div>
      <small>현재는 공식 시험 결제 환경입니다. 실제 금액은 청구되지 않으며 상품 정보는 출시 준비용 샘플입니다.</small>
    </footer>
  );
}
