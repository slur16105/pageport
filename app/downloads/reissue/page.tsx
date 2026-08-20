// 주문번호를 외울 필요 없이 구매 이메일 인증으로 PDF 다운로드 주소를 다시 받게 하는 페이지입니다.
import type { Metadata } from "next";
import { SiteFooter } from "../../../components/SiteFooter";
import { SiteHeader } from "../../../components/SiteHeader";
import { ReissueDownloadForm } from "./ReissueDownloadForm";

export const metadata: Metadata = {
  title: "다운로드 주소 다시 받기 | PAGEPORT",
  robots: { index: false, follow: false },
};

export default function ReissueDownloadPage() {
  return (
    <main className="reissue-page">
      <SiteHeader />
      <section className="reissue-shell">
        <div className="reissue-copy">
          <p className="eyebrow">RE-DOWNLOAD</p>
          <h1>
            <span>구매한 PDF를</span>
            <span>다시 받아보세요.</span>
          </h1>
          <p>구매 이메일을 확인하면 구매했던 상품을 보여드립니다. 주문번호를 기억하거나 다시 결제할 필요는 없습니다.</p>
        </div>
        <ReissueDownloadForm />
      </section>
      <SiteFooter />
    </main>
  );
}
