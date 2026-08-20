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
