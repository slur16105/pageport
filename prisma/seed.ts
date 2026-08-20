import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { products } from "../app/data/products";

// 이 파일은 빈 데이터베이스에 화면 확인용 샘플 상품과 PDF를 넣습니다.
// 같은 파일을 다시 실행해도 상품이 중복되지 않고 최신 샘플 내용으로 갱신됩니다.
process.loadEnvFile?.(".env.local");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const amountFrom = (price: string) => Number(price.replace(/[^0-9]/g, ""));

async function main() {
  // slug(상품 주소용 영문 이름)를 기준으로 기존 상품은 수정하고, 없으면 새로 만듭니다.
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
    // Supabase 비밀키가 준비된 환경에서는 샘플 PDF도 비공개 상품 보관함에 올립니다.
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
    // 중간에 실패하면 원인을 보여주고 연결을 안전하게 닫은 뒤 실패 상태로 끝냅니다.
    console.error(error instanceof Error ? error.message : "seed failed");
    await prisma.$disconnect();
    process.exit(1);
  });
