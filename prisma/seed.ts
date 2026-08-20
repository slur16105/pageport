import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { products } from "../app/data/products";

process.loadEnvFile?.(".env.local");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const amountFrom = (price: string) => Number(price.replace(/[^0-9]/g, ""));

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        category: product.category,
        title: product.title,
        sellerName: product.seller,
        description: product.description,
        amount: amountFrom(product.price),
        accent: product.accent,
        mark: product.mark,
        pages: product.pages,
        fileSize: product.fileSize,
        summary: product.summary,
        includes: product.includes,
        status: "published",
        objectKey: `products/${product.slug}.pdf`,
      },
      update: {
        category: product.category,
        title: product.title,
        sellerName: product.seller,
        description: product.description,
        amount: amountFrom(product.price),
        accent: product.accent,
        mark: product.mark,
        pages: product.pages,
        fileSize: product.fileSize,
        summary: product.summary,
        includes: product.includes,
      },
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (url && key) {
    const storage = createClient(url, key, { auth: { persistSession: false } });
    const sample = await readFile("public/sample-pdfs/weekly-work-planner.pdf");
    for (const product of products) {
      const { error } = await storage.storage.from("product-pdfs").upload(`products/${product.slug}.pdf`, sample, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (error) throw error;
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "seed failed");
    await prisma.$disconnect();
    process.exit(1);
  });
