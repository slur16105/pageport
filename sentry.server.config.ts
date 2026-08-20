// 데이터베이스·결제 처리를 담당하는 일반 서버에서 발생한 오류를 기록하는 Sentry 설정입니다.
import * as Sentry from "@sentry/nextjs";
import { scrubTelemetryEvent } from "./lib/privacy";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  // 오류를 외부로 보내기 직전에 주문번호·결제키 같은 민감정보를 제거합니다.
  beforeSend: scrubTelemetryEvent,
  beforeSendTransaction: scrubTelemetryEvent,
});
