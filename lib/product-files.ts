// 이 파일은 상품 PDF의 저장 위치를 정하고 시험 상품에 필요한 샘플 파일을 준비합니다.
import { readFile } from "node:fs/promises";
import { supabaseAdmin, PRIVATE_PDF_BUCKET } from "./supabase";

export function productObjectKey(productSlug: string) {
  return `products/${productSlug}.pdf`;
}

export async function ensureTestProductFile(_request: Request, productSlug: string) {
  // 시험 결제 후 파일이 없어서 다운로드가 실패하지 않도록 샘플 PDF가 있는지 확인합니다.
  const objectKey = productObjectKey(productSlug);
  const storage = supabaseAdmin().storage.from(PRIVATE_PDF_BUCKET);
  const { data } = await storage.list("products", { search: `${productSlug}.pdf`, limit: 1 });
  if (data?.some((item) => item.name === `${productSlug}.pdf`)) return objectKey;
  const sample = await readFile("public/sample-pdfs/weekly-work-planner.pdf");
  const { error } = await storage.upload(objectKey, sample, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  return objectKey;
}
