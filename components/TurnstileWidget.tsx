"use client";

// 사람이 직접 요청한 것인지 확인해 인증번호 남용을 줄이는 Cloudflare Turnstile 보안 부품입니다.

import Script from "next/script";
import { useCallback, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; theme: string },
      ) => string;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  // 운영용 공개 키가 아직 없으면 화면을 막지 않고 보안 부품만 숨겨 개발·시험을 이어갑니다.
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const render = useCallback(() => {
    // 같은 확인창이 두 번 생기지 않도록 한 번만 만들고, 통과한 증표를 부모 화면에 전달합니다.
    if (!siteKey || !container.current || !window.turnstile || rendered.current) return;
    window.turnstile.render(container.current, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": () => onToken(""),
      theme: "light",
    });
    rendered.current = true;
  }, [onToken, siteKey]);
  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={render}
      />
      <div ref={container} className="turnstile-box" aria-label="자동 요청 방지 확인" />
    </>
  );
}
