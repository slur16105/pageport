import { z } from "zod";
import { isAdminRequest } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";
import { productObjectKey } from "../../../../lib/product-files";
import { PRIVATE_PDF_BUCKET, supabaseAdmin } from "../../../../lib/supabase";

const productSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(1),
  sellerName: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  summary: z.string().min(1),
  mark: z.string().min(1).max(12),
  accent: z.string().min(1),
  status: z.enum(["draft", "published", "paused"]),
  amount: z.coerce.number().int().min(100),
  pages: z.coerce.number().int().min(1),
  includes: z.string().transform((value) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  ),
  uploadedObjectKey: z.string().optional(),
  uploadedFileSize: z.string().optional(),
});

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  return Response.json({ products: await prisma.product.findMany({ orderBy: { updatedAt: "desc" } }) });
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request)))
      return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    const form = await request.formData();
    const input = productSchema.parse(Object.fromEntries(form.entries()));
    const existing = input.slug ? await prisma.product.findUnique({ where: { slug: input.slug } }) : null;
    if (input.slug && !existing) return Response.json({ error: "수정할 상품을 찾지 못했습니다." }, { status: 404 });
    const slug = existing?.slug ?? `pdf-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const finalObjectKey = existing?.objectKey || productObjectKey(slug);
    let objectKey = finalObjectKey;
    const directFile = form.get("file");
    let fileSize = input.uploadedFileSize || existing?.fileSize || "";
    if (directFile instanceof File && directFile.size > 0) {
      if (directFile.type !== "application/pdf" || directFile.size > 25 * 1024 * 1024)
        return Response.json({ error: "25MB 이하의 PDF 파일만 등록할 수 있습니다." }, { status: 400 });
      const { error } = await supabaseAdmin()
        .storage.from(PRIVATE_PDF_BUCKET)
        .upload(objectKey, directFile, { contentType: "application/pdf", upsert: true });
      if (error) throw error;
      fileSize =
        directFile.size >= 1024 * 1024
          ? `${(directFile.size / 1024 / 1024).toFixed(1)}MB`
          : `${Math.ceil(directFile.size / 1024)}KB`;
    }
    if (input.uploadedObjectKey) {
      const ticket = await prisma.uploadTicket.findFirst({
        where: { objectKey: input.uploadedObjectKey, usedAt: null, expiresAt: { gt: new Date() } },
      });
      if (!ticket)
        return Response.json({ error: "업로드 권한이 만료되었습니다. PDF를 다시 선택해 주세요." }, { status: 400 });
      const { error } = await supabaseAdmin()
        .storage.from(PRIVATE_PDF_BUCKET)
        .move(input.uploadedObjectKey, finalObjectKey);
      if (error) throw error;
      await prisma.uploadTicket.update({ where: { id: ticket.id }, data: { usedAt: new Date() } });
      objectKey = finalObjectKey;
    }
    if (!existing && !input.uploadedObjectKey && !(directFile instanceof File && directFile.size > 0))
      return Response.json({ error: "새 상품에는 PDF 파일이 필요합니다." }, { status: 400 });
    const values = {
      category: input.category,
      title: input.title,
      sellerName: input.sellerName,
      description: input.description,
      amount: input.amount,
      accent: input.accent,
      mark: input.mark.toUpperCase(),
      pages: input.pages,
      fileSize,
      summary: input.summary,
      includes: input.includes,
      status: input.status,
      objectKey,
    };
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data: values })
      : await prisma.product.create({ data: { slug, ...values } });
    return Response.json({ product });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "필수 상품 정보를 다시 확인해 주세요."
        : error instanceof Error
          ? error.message
          : "상품 저장 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
