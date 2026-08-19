import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "다운로드 안내 | PAGEPORT", robots: { index: false, follow: false } };

type Reason = "expired" | "limit" | "refunded" | "missing" | "unavailable";
type Props = { searchParams: Promise<{ reason?: string }> };

const messages: Record<Reason, { label: string; title: string; description: string; action: string; href: string }> = {
  expired: { label: "LINK EXPIRED", title: "다운로드 시간이 지났어요.", description: "파일이 사라진 것은 아닙니다. 구매 이메일을 한 번 더 확인하면 새로운 다운로드 주소를 받을 수 있어요.", action: "새 다운로드 주소 받기", href: "/downloads/reissue" },
  limit: { label: "LIMIT REACHED", title: "다운로드 횟수를 모두 사용했어요.", description: "안전한 파일 전달을 위해 한 주소는 5회까지만 사용할 수 있습니다. 구매 이메일을 확인하고 새 주소를 받아주세요.", action: "새 다운로드 주소 받기", href: "/downloads/reissue" },
  refunded: { label: "ORDER REFUNDED", title: "환불이 완료된 주문이에요.", description: "환불된 주문의 다운로드 주소는 바로 닫힙니다. 다른 실용적인 PDF를 페이지포트에서 둘러보세요.", action: "다른 상품 둘러보기", href: "/#products" },
  missing: { label: "FILE CHECK", title: "파일을 준비하지 못했어요.", description: "상품 파일을 다시 확인하고 있습니다. 잠시 후 다시 시도해 주세요. 계속 같은 안내가 나오면 판매처에 문의해 주세요.", action: "상품 목록으로 돌아가기", href: "/#products" },
  unavailable: { label: "DOWNLOAD NOTICE", title: "이 주소로는 다운로드할 수 없어요.", description: "주문 상태 또는 다운로드 주소를 확인할 수 없습니다. 구매 이메일로 새로운 주소를 받아보세요.", action: "다운로드 주소 다시 받기", href: "/downloads/reissue" },
};

export default async function DownloadUnavailablePage({ searchParams }: Props) {
  const params = await searchParams;
  const reason = (params.reason && params.reason in messages ? params.reason : "unavailable") as Reason;
  const message = messages[reason];

  return (
    <main className="download-unavailable-page">
      <header className="download-unavailable-header"><Link className="brand" href="/">PAGEPORT<span>.</span></Link><span>구매 파일 안내</span></header>
      <section className="download-unavailable-shell">
        <div className="download-unavailable-mark" aria-hidden="true"><span>PDF</span><i>×</i></div>
        <div className="download-unavailable-copy">
          <p className="eyebrow">{message.label}</p>
          <h1>{message.title}</h1>
          <p>{message.description}</p>
          <div className="download-unavailable-actions"><Link className="primary-button" href={message.href}>{message.action}</Link><Link href="/">페이지포트 홈</Link></div>
        </div>
      </section>
      <footer className="download-unavailable-footer"><span>PAGEPORT DIGITAL DOCUMENT MARKET</span><span>안전한 결제 · 안전한 파일 전달</span></footer>
    </main>
  );
}
