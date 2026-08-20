// 검색 공개 전에는 각 화면의 noindex 안내를 로봇이 읽게 하되, 결제·관리 화면은 항상 수집하지 못하게 막습니다.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const enabled = process.env.ENABLE_SEARCH_INDEXING === "true";

  const privatePaths = ["/admin/", "/api/", "/checkout/", "/payment/", "/downloads/", "/access/", "/about"];

  // 전체를 robots.txt로 막으면 SNS도 대표 이미지를 읽지 못할 수 있습니다.
  // 공개 화면은 읽을 수 있게 두고, layout의 noindex로 검색 결과 등록만 보류합니다.
  if (!enabled) return { rules: { userAgent: "*", allow: "/", disallow: privatePaths } };

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privatePaths,
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
