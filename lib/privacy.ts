// 이 파일은 오류·통계 서비스로 보내기 전에 결제키, 주문번호, 다운로드 주소를 가립니다.
const SENSITIVE_QUERY_KEYS = ["paymentKey", "orderId", "amount", "emailVerificationToken", "code"];

export function scrubSensitiveUrl(value: string) {
  // 주소 자체는 분석에 남기되 구매자를 식별하거나 결제에 쓰이는 값은 삭제합니다.
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
  // 오류 보고 내용의 주소, 쿠키, 입력 데이터에서도 민감한 정보를 한 번 더 제거합니다.
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
