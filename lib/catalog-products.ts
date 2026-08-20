// 이 파일은 데이터베이스의 판매 상품을 화면에서 쓰는 모양으로 바꾸고 상품 목록을 제공합니다.
import type { Product } from "../app/data/products";
import { products as sampleProducts } from "../app/data/products";
import { prisma } from "./prisma";

const won = new Intl.NumberFormat("ko-KR");

function toProduct(row: {
  slug: string;
  category: string;
  title: string;
  sellerName: string;
  description: string;
  amount: number;
  accent: string;
  mark: string;
  pages: number;
  fileSize: string;
  summary: string;
  includes: string[];
}): Product {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    seller: row.sellerName,
    description: row.description,
    price: `${won.format(row.amount)}원`,
    rating: "0.0",
    reviews: "0",
    accent: row.accent,
    mark: row.mark,
    pages: row.pages,
    fileSize: row.fileSize,
    summary: row.summary,
    includes: row.includes,
  };
}

export async function listPublishedProducts() {
  // 데이터베이스가 잠시 연결되지 않아도 시험 화면은 샘플 상품으로 확인할 수 있습니다.
  try {
    const rows = await prisma.product.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "asc" },
    });
    return rows.length ? rows.map(toProduct) : sampleProducts;
  } catch {
    return sampleProducts;
  }
}

export async function getPublishedProduct(slug: string) {
  // 공개 상태인 상품만 보여 주며, 개발 중에는 같은 주소의 샘플 상품을 대신 찾습니다.
  try {
    const row = await prisma.product.findFirst({ where: { slug, status: "published" } });
    return row ? toProduct(row) : undefined;
  } catch {
    return sampleProducts.find((product) => product.slug === slug);
  }
}
