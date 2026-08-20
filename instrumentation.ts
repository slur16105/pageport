// 서버가 시작될 때 실행 환경에 맞는 Sentry 오류 수집 설정을 불러옵니다.
// 서버 종류에 맞는 Sentry 오류 기록 장치를 필요한 순간에만 불러옵니다.
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

export const onRequestError = async (...args: Parameters<(typeof import("@sentry/nextjs"))["captureRequestError"]>) => {
  // 서버 요청이 실패하면 원인을 Sentry에 남겨 운영자가 나중에 확인할 수 있게 합니다.
  // 서버 요청 중 발생한 오류도 Sentry가 설정된 경우에만 기록합니다.
  if (!process.env.SENTRY_DSN) return;
  const { captureRequestError } = await import("@sentry/nextjs");
  return captureRequestError(...args);
};
