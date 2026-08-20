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
  try {
    const row = await prisma.product.findFirst({ where: { slug, status: "published" } });
    return row ? toProduct(row) : undefined;
  } catch {
    return sampleProducts.find((product) => product.slug === slug);
  }
}
