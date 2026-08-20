const SENSITIVE_QUERY_KEYS = ["paymentKey", "orderId", "amount", "emailVerificationToken", "code"];

export function scrubSensitiveUrl(value: string) {
  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(value);
    const url = new URL(value, "https://pageport.invalid");
    for (const key of SENSITIVE_QUERY_KEYS) url.searchParams.delete(key);
    if (url.pathname.startsWith("/api/download/")) url.pathname = "/api/download/[redacted]";
    return absolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "[redacted-url]";
  }
}

type TelemetryEvent = {
  request?: {
    url?: string;
    query_string?: unknown;
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, string>;
  };
  transaction?: string;
  breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
};

export function scrubTelemetryEvent<T extends TelemetryEvent>(event: T) {
  if (event.request) {
    if (event.request.url) event.request.url = scrubSensitiveUrl(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      delete event.request.headers.referer;
      delete event.request.headers.referrer;
    }
  }
  if (event.transaction) event.transaction = scrubSensitiveUrl(event.transaction);
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (!breadcrumb.data) continue;
    for (const key of ["url", "from", "to"]) {
      const value = breadcrumb.data[key];
      if (typeof value === "string") breadcrumb.data[key] = scrubSensitiveUrl(value);
    }
  }
  return event;
}
