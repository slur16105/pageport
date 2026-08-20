// PAGEPORT의 모든 페이지에 공통으로 적용되는 글꼴, 기본 정보, 분석 도구와 전체 뼈대를 정하는 파일입니다.
import type { Metadata } from "next";
import Script from "next/script";
import { PrivacyAnalytics } from "../components/PrivacyAnalytics";
import { StructuredData } from "../components/StructuredData";
import "./globals.css";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
// 실제 오픈 준비가 끝난 뒤 이 값을 true로 바꾸기 전에는 운영 배포여도 검색 결과에 노출하지 않습니다.
const searchIndexingEnabled = process.env.ENABLE_SEARCH_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "PAGEPORT",
  title: { default: "PAGEPORT — 전문 지식이 오가는 디지털 문서 마켓", template: "%s | PAGEPORT" },
  description: "회원가입 없이 이메일 인증 후 실용 PDF를 안전하게 구매하고 다시 받을 수 있는 디지털 문서 마켓입니다.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  robots: searchIndexingEnabled
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
  openGraph: {
    title: "PAGEPORT",
    description: "회원가입 없이 이메일 인증으로 구매하고 다시 받는 실용 PDF 마켓",
    type: "website",
    locale: "ko_KR",
    siteName: "PAGEPORT",
    url: appUrl,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "PAGEPORT 디지털 문서 마켓" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PAGEPORT — 전문 지식이 오가는 디지털 문서 마켓",
    description: "회원가입 없이 이메일 인증으로 구매하고 다시 받는 실용 PDF 마켓",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // 방문 분석은 운영 환경에서 관리자가 켠 경우에만 작동해 개발·시험 방문이 통계에 섞이지 않게 합니다.
  const analyticsEnabled = process.env.VERCEL_ENV === "production" && process.env.ENABLE_ANALYTICS === "true";
  const gaId = analyticsEnabled ? process.env.NEXT_PUBLIC_GA_ID : undefined;
  return (
    <html lang="ko">
      <body>
        {/* 사이트 이름과 운영 주체를 검색엔진·AI가 같은 의미로 이해하도록 기계용 설명을 제공합니다. */}
        <StructuredData
          data={[
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "PAGEPORT",
              alternateName: "페이지포트",
              url: appUrl,
              description: "회원가입 없이 이메일 인증으로 실용 PDF를 구매하고 다시 받는 디지털 문서 마켓",
              inLanguage: "ko-KR",
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PAGEPORT",
              url: appUrl,
            },
          ]}
        />
        {/* 결제 성공 주소에 담긴 민감한 결제 정보를 분석 도구보다 먼저 브라우저 주소창에서 지웁니다. */}
        <Script id="pageport-payment-query-scrub" strategy="beforeInteractive">
          {`if(location.pathname==='/payment/success'&&location.search){history.replaceState(history.state,'',location.pathname+location.hash)}`}
        </Script>
        {children}
        {/* 실제 운영에서 허용했을 때만 개인정보를 정리한 방문·속도 통계를 기록합니다. */}
        {analyticsEnabled && <PrivacyAnalytics />}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script
              id="pageport-ga4"
              strategy="afterInteractive"
            >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true,page_location:location.origin+location.pathname});`}</Script>
          </>
        )}
      </body>
    </html>
  );
}
