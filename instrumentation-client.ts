import * as Sentry from "@sentry/nextjs";
import { scrubTelemetryEvent } from "./lib/privacy";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend: scrubTelemetryEvent,
    beforeSendTransaction: scrubTelemetryEvent,
  });
}
