import { readFile } from "node:fs/promises";
import { supabaseAdmin, PRIVATE_PDF_BUCKET } from "./supabase";

export function productObjectKey(productSlug: string) {
  return `products/${productSlug}.pdf`;
}

export async function ensureTestProductFile(_request: Request, productSlug: string) {
  const objectKey = productObjectKey(productSlug);
  const storage = supabaseAdmin().storage.from(PRIVATE_PDF_BUCKET);
  const { data } = await storage.list("products", { search: `${productSlug}.pdf`, limit: 1 });
  if (data?.some((item) => item.name === `${productSlug}.pdf`)) return objectKey;
  const sample = await readFile("public/sample-pdfs/weekly-work-planner.pdf");
  const { error } = await storage.upload(objectKey, sample, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  return objectKey;
}
