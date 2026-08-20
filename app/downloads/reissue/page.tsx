import type { Metadata } from "next";
import Link from "next/link";
import { ReissueDownloadForm } from "./ReissueDownloadForm";

export const metadata: Metadata = {
  title: "다운로드 주소 다시 받기 | PAGEPORT",
  robots: { index: false, follow: false },
};

export default function ReissueDownloadPage() {
  return (
    <main className="reissue-page">
      <header className="reissue-header">
        <Link className="brand" href="/">
          PAGEPORT<span>.</span>
        </Link>
        <span>구매 파일 다시 받기</span>
      </header>
      <section className="reissue-shell">
        <div className="reissue-copy">
          <p className="eyebrow">RE-DOWNLOAD</p>
          <h1>
            구매한 PDF를
            <br />
            다시 받아보세요.
          </h1>
          <p>구매 이메일을 확인하면 구매했던 상품을 보여드립니다. 주문번호를 기억하거나 다시 결제할 필요는 없습니다.</p>
        </div>
        <ReissueDownloadForm />
      </section>
    </main>
  );
}
