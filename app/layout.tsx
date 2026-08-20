import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
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
  const analyticsEnabled = process.env.VERCEL_ENV === "production" && process.env.ENABLE_ANALYTICS === "true";
  const gaId = analyticsEnabled ? process.env.NEXT_PUBLIC_GA_ID : undefined;
  return (
    <html lang="ko">
      <body>
        {children}
        {analyticsEnabled && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script
              id="pageport-ga4"
              strategy="afterInteractive"
            >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}</Script>
          </>
        )}
      </body>
    </html>
  );
}
