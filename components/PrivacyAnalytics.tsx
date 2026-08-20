"use client";

// 방문 통계와 속도를 기록하되 결제키·주문번호 같은 민감한 주소 정보는 먼저 지우는 분석 부품입니다.

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { scrubSensitiveUrl } from "../lib/privacy";

export function PrivacyAnalytics() {
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: scrubSensitiveUrl(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: scrubSensitiveUrl(event.url) })} />
    </>
  );
}
