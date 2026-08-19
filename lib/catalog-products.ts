import { asc, eq } from "drizzle-orm";
import { products as sampleProducts, type Product } from "../app/data/products";

type CatalogRow = {
  slug: string; category: string; title: string; sellerName: string; description: string; amount: number;
  rating: string; reviews: number; accent: string; mark: string; pages: number; fileSize: string; summary: string;
  includesJson: string; status: string; objectKey: string; createdAt: string; updatedAt: string;
};

async function databaseModules() {
  const [{ env }, dbModule, schemaModule, ensureModule] = await Promise.all([
    import("cloudflare:workers"),
    import("../db"),
    import("../db/schema"),
    import("../db/ensure-products"),
  ]);
  return { env, ...dbModule, ...schemaModule, ...ensureModule };
}

function toProduct(row: CatalogRow): Product {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    seller: row.sellerName,
    description: row.description,
    price: `${new Intl.NumberFormat("ko-KR").format(row.amount)}원`,
    rating: row.rating,
    reviews: String(row.reviews),
    accent: row.accent,
    mark: row.mark,
    pages: row.pages,
    fileSize: row.fileSize,
    summary: row.summary,
    includes: JSON.parse(row.includesJson) as string[],
  };
}

export async function seedSampleProducts() {
  const modules = await databaseModules();
  await modules.ensureProductsSchema();
  const now = new Date().toISOString();
  for (const product of sampleProducts) {
    await modules.getDb().insert(modules.catalogProducts).values({
      slug: product.slug,
      category: product.category,
      title: product.title,
      sellerName: product.seller,
      description: product.description,
      amount: Number(product.price.replace(/[^0-9]/g, "")),
      rating: product.rating,
      reviews: Number(product.reviews),
      accent: product.accent,
      mark: product.mark,
      pages: product.pages,
      fileSize: product.fileSize,
      summary: product.summary,
      includesJson: JSON.stringify(product.includes),
      status: "published",
      objectKey: `products/${product.slug}.pdf`,
      updatedAt: now,
    }).onConflictDoNothing();
  }
}

export async function listPublishedProducts() {
  try {
    const modules = await databaseModules();
    if (!(modules.env as unknown as { DB?: unknown }).DB) return sampleProducts;
    await seedSampleProducts();
    const rows = await modules.getDb().select().from(modules.catalogProducts).where(eq(modules.catalogProducts.status, "published")).orderBy(asc(modules.catalogProducts.createdAt));
    return (rows as CatalogRow[]).map(toProduct);
  } catch (error) {
    if (error instanceof Error && /cloudflare:|D1 binding/.test(error.message)) return sampleProducts;
    throw error;
  }
}

export async function getPublishedProduct(slug: string) {
  try {
    const modules = await databaseModules();
    if (!(modules.env as unknown as { DB?: unknown }).DB) return sampleProducts.find((product) => product.slug === slug);
    await seedSampleProducts();
    const rows = await modules.getDb().select().from(modules.catalogProducts).where(eq(modules.catalogProducts.slug, slug)).limit(1);
    const row = rows[0] as CatalogRow | undefined;
    return row?.status === "published" ? toProduct(row) : undefined;
  } catch (error) {
    if (error instanceof Error && /cloudflare:|D1 binding/.test(error.message)) return sampleProducts.find((product) => product.slug === slug);
    throw error;
  }
}
