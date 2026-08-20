"use client";

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
