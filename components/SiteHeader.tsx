// 여러 페이지 위에 반복해서 쓰는 공통 헤더로, 로고·상품·구매 안내·재다운로드 메뉴를 제공합니다.
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header" role="banner">
      <Link className="brand" href="/#top" aria-label="페이지포트 홈">
        PAGEPORT<span>.</span>
      </Link>
      <nav aria-label="주요 메뉴">
        <Link href="/#products">PDF 둘러보기</Link>
        <Link href="/#guide">구매 방법</Link>
        <Link href="/#faq">자주 묻는 질문</Link>
      </nav>
      <Link className="header-button" href="/downloads/reissue">
        구매 파일 다시 받기
      </Link>
    </header>
  );
}
