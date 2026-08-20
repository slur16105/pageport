import type { NextConfig } from "next";

// Next.js 전체 동작을 정하는 파일입니다. 업로드 크기와 브라우저 보안 규칙을 여기서 관리합니다.
const nextConfig: NextConfig = {
  // 서버로 한 번에 보낼 수 있는 입력을 1MB로 제한해 비정상적으로 큰 요청을 막습니다.
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
  // 사용 기술 이름을 응답에 노출하지 않아 불필요한 공격 단서를 줄입니다.
  poweredByHeader: false,
  async headers() {
    // 모든 페이지에 공통 보안 안내문을 붙여 위험한 파일 해석, 외부 삽입, 카메라 접근 등을 제한합니다.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
