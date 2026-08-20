// 정식 검색 공개 뒤에만 홈과 판매 중인 상품 주소를 검색엔진에 전달합니다.
import type { MetadataRoute } from "next";
import { listPublishedProducts } from "../lib/catalog-products";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.ENABLE_SEARCH_INDEXING !== "true") return [];

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const products = await listPublishedProducts();

  return [
    { url: appUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...products.map((product) => ({
      url: `${appUrl}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
