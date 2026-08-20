// 방문자의 브라우저에서 발생한 오류를 Sentry로 기록하되 결제·주문 정보는 먼저 가립니다.
import * as Sentry from "@sentry/nextjs";
import { scrubTelemetryEvent } from "./lib/privacy";

// 브라우저 오류 수집 주소가 설정된 경우에만 Sentry를 켭니다. 설정하지 않으면 아무 정보도 보내지 않습니다.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Sentry 계정을 연결한 경우에만 작동하므로 연결 전에는 비용이나 데이터 전송이 발생하지 않습니다.
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1, // 성능 기록은 전체 방문의 10%만 표본으로 수집합니다.
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // 전송 직전에 결제키와 다운로드 주소 같은 민감 정보를 지웁니다.
    beforeSend: scrubTelemetryEvent,
    beforeSendTransaction: scrubTelemetryEvent,
  });
}
