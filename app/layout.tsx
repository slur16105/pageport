// PAGEPORT의 모든 페이지에 공통으로 적용되는 글꼴, 기본 정보, 분석 도구와 전체 뼈대를 정하는 파일입니다.
import type { Metadata } from "next";
import Script from "next/script";
import { PrivacyAnalytics } from "../components/PrivacyAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "PAGEPORT — 전문 지식이 오가는 디지털 문서 마켓", template: "%s | PAGEPORT" },
  description: "회원가입 없이 이메일 인증 후 실용 PDF를 안전하게 구매하고 다시 받을 수 있는 디지털 문서 마켓입니다.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  robots: process.env.VERCEL_ENV === "production" ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    title: "PAGEPORT",
    description: "전문 지식이 오가는 디지털 문서 마켓",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // 방문 분석은 운영 환경에서 관리자가 켠 경우에만 작동해 개발·시험 방문이 통계에 섞이지 않게 합니다.
  const analyticsEnabled = process.env.VERCEL_ENV === "production" && process.env.ENABLE_ANALYTICS === "true";
  const gaId = analyticsEnabled ? process.env.NEXT_PUBLIC_GA_ID : undefined;
  return (
    <html lang="ko">
      <body>
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
