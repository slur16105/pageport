import * as Sentry from "@sentry/nextjs";
import { scrubTelemetryEvent } from "./lib/privacy";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend: scrubTelemetryEvent,
  beforeSendTransaction: scrubTelemetryEvent,
});
