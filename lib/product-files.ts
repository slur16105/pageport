import { env } from "cloudflare:workers";
import { getFiles } from "../db";

export function productObjectKey(productSlug: string) {
  return `products/${productSlug}.pdf`;
}

export async function ensureTestProductFile(request: Request, productSlug: string) {
  const files = getFiles();
  const objectKey = productObjectKey(productSlug);
  if (await files.head(objectKey)) return objectKey;

  if (productSlug !== "weekly-work-planner") {
    throw new Error("이 시험 상품의 PDF 샘플은 아직 준비되지 않았습니다.");
  }

  const runtimeEnv = env as unknown as { ASSETS?: { fetch(request: Request): Promise<Response> } };
  const assetRequest = new Request(new URL(`/sample-pdfs/${productSlug}.pdf`, request.url));
  const assetResponse = runtimeEnv.ASSETS
    ? await runtimeEnv.ASSETS.fetch(assetRequest)
    : await fetch(assetRequest);
  if (!assetResponse.ok || !assetResponse.body) throw new Error("시험용 PDF를 파일 창고에 준비하지 못했습니다.");

  await files.put(objectKey, assetResponse.body, {
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: { productSlug, purpose: "pageport-test-product" },
  });
  return objectKey;
}
