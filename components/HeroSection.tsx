"use client";

import type { PointerEvent } from "react";

function resetPointerMotion(element: HTMLElement) {
  element.style.setProperty("--hero-back-x", "0px");
  element.style.setProperty("--hero-back-y", "0px");
  element.style.setProperty("--hero-back-rotate", "-9deg");
  element.style.setProperty("--hero-front-x", "0px");
  element.style.setProperty("--hero-front-y", "0px");
  element.style.setProperty("--hero-front-rotate", "7deg");
  element.style.setProperty("--hero-sun-x", "0px");
  element.style.setProperty("--hero-sun-y", "0px");
}

export function HeroSection() {
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const art = event.currentTarget;
    const rect = art.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    art.style.setProperty("--hero-back-x", `${(-x * 5).toFixed(2)}px`);
    art.style.setProperty("--hero-back-y", `${(-y * 4).toFixed(2)}px`);
    art.style.setProperty("--hero-back-rotate", `${(-9 - x * 1.2).toFixed(2)}deg`);
    art.style.setProperty("--hero-front-x", `${(x * 9).toFixed(2)}px`);
    art.style.setProperty("--hero-front-y", `${(y * 7).toFixed(2)}px`);
    art.style.setProperty("--hero-front-rotate", `${(7 + x * 1.5).toFixed(2)}deg`);
    art.style.setProperty("--hero-sun-x", `${(x * 4).toFixed(2)}px`);
    art.style.setProperty("--hero-sun-y", `${(y * 3).toFixed(2)}px`);
  };

  return (
    <section className="hero hero-motion" id="top">
      <div className="hero-copy">
        <p className="eyebrow">실무에 바로 쓰는 디지털 문서</p>
        <h1>
          전문 지식이,
          <br />
          <em>새로운 기회로.</em>
        </h1>
        <p className="hero-description">
          일과 공부, 생활에 바로 쓰는 PDF를 발견하세요. 회원가입 없이 이메일을 확인하고 결제하면 화면과 이메일에서 바로
          받을 수 있습니다.
        </p>
        <div className="hero-actions">
          <a className="primary-button" href="#products">
            PDF 둘러보기
          </a>
          <a className="text-link" href="/downloads/reissue">
            구매 파일 다시 받기 <span>→</span>
          </a>
        </div>
        <div className="trust-row" aria-label="서비스 장점">
          <span>✓ 회원가입 없는 구매</span>
          <span>✓ 결제 즉시 다운로드</span>
          <span>✓ 이메일 인증 재발급</span>
        </div>
      </div>
      <div
        className="hero-art"
        aria-label="페이지포트 PDF 상품 미리보기"
        onPointerMove={handlePointerMove}
        onPointerLeave={(event) => resetPointerMotion(event.currentTarget)}
      >
        <div className="sun-shape" />
        <div className="paper paper-back">
          <small>MONTHLY</small>
          <strong>08</strong>
          <div className="paper-lines" />
        </div>
        <div className="paper paper-front">
          <div className="paper-brand">PAGEPORT</div>
          <p>
            WEEKLY
            <br />
            FOCUS
          </p>
          <span>
            Made by creators.
            <br />
            Ready for you.
          </span>
          <div className="paper-grid" />
        </div>
        <div className="scribble">✦</div>
      </div>
    </section>
  );
}
