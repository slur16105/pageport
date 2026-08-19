import { desc, eq } from "drizzle-orm";
import { getDb, getFiles } from "../../../../db";
import { ensureProductsSchema } from "../../../../db/ensure-products";
import { catalogProducts } from "../../../../db/schema";
import { isAdminRequest } from "../../../../lib/admin-auth";
import { seedSampleProducts } from "../../../../lib/catalog-products";
import { productObjectKey } from "../../../../lib/product-files";

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const STATUSES = new Set(["draft", "published", "paused"]);

export const config = { api: { bodyParser: { sizeLimit: "26mb" } } };

function productDto(product: typeof catalogProducts.$inferSelect) {
  return { ...product, includes: JSON.parse(product.includesJson) as string[] };
}

async function createProductSlug() {
  const db = getDb();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `pdf-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const [duplicate] = await db.select({ slug: catalogProducts.slug }).from(catalogProducts).where(eq(catalogProducts.slug, candidate)).limit(1);
    if (!duplicate) return candidate;
  }
  throw new Error("상품 주소를 만들지 못했습니다. 다시 저장해 주세요.");
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  await seedSampleProducts();
  const products = await getDb().select().from(catalogProducts).orderBy(desc(catalogProducts.updatedAt));
  return Response.json({ products: products.map(productDto) });
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    const form = await request.formData();
    const requestedSlug = String(form.get("slug") ?? "").trim().toLowerCase();
    const title = String(form.get("title") ?? "").trim();
    const sellerName = String(form.get("sellerName") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const summary = String(form.get("summary") ?? "").trim();
    const mark = String(form.get("mark") ?? "PDF").trim().slice(0, 12).toUpperCase();
    const accent = String(form.get("accent") ?? "mint").trim();
    const status = String(form.get("status") ?? "draft").trim();
    const amount = Number(form.get("amount"));
    const pages = Number(form.get("pages"));
    const includes = String(form.get("includes") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
    const file = form.get("file");

    if (!title || !sellerName || !category || !description || !summary || !mark || !Number.isInteger(amount) || amount < 100 || !Number.isInteger(pages) || pages < 1 || !includes.length || !STATUSES.has(status)) {
      return Response.json({ error: "필수 상품 정보를 다시 확인해 주세요." }, { status: 400 });
    }
    if (requestedSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedSlug)) {
      return Response.json({ error: "상품 주소 정보가 올바르지 않습니다." }, { status: 400 });
    }

    await ensureProductsSchema();
    const db = getDb();
    const [existing] = requestedSlug
      ? await db.select().from(catalogProducts).where(eq(catalogProducts.slug, requestedSlug)).limit(1)
      : [];
    if (requestedSlug && !existing) {
      return Response.json({ error: "수정할 상품을 찾지 못했습니다. 목록에서 다시 선택해 주세요." }, { status: 404 });
    }
    const slug = existing?.slug ?? await createProductSlug();
    const hasFile = file instanceof File && file.size > 0;
    if (!existing && !hasFile) return Response.json({ error: "새 상품에는 PDF 파일이 필요합니다." }, { status: 400 });
    if (hasFile && (!file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_PDF_BYTES)) {
      return Response.json({ error: "25MB 이하의 PDF 파일만 등록할 수 있습니다." }, { status: 400 });
    }

    const objectKey = existing?.objectKey ?? productObjectKey(slug);
    let fileSize = existing?.fileSize ?? "";
    if (hasFile) {
      const bytes = file.size;
      fileSize = bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`;
      await getFiles().put(objectKey, file.stream(), { httpMetadata: { contentType: "application/pdf" }, customMetadata: { productSlug: slug } });
    }
    if (status === "published" && !(await getFiles().head(objectKey))) {
      return Response.json({ error: "PDF 파일이 있어야 판매를 시작할 수 있습니다." }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    const [saved] = await db.insert(catalogProducts).values({
      slug, category, title, sellerName, description, amount, rating: existing?.rating ?? "0.0", reviews: existing?.reviews ?? 0,
      accent, mark, pages, fileSize, summary, includesJson: JSON.stringify(includes), status, objectKey, updatedAt,
    }).onConflictDoUpdate({
      target: catalogProducts.slug,
      set: { category, title, sellerName, description, amount, accent, mark, pages, fileSize, summary, includesJson: JSON.stringify(includes), status, objectKey, updatedAt },
    }).returning();
    return Response.json({ product: productDto(saved) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "상품 저장 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
