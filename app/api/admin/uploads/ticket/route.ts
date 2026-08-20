import { z } from "zod";
import { isAdminRequest } from "../../../../../lib/admin-auth";
import { env } from "../../../../../lib/env";
import { prisma } from "../../../../../lib/prisma";

const schema = z.object({
  fileName: z.string().min(1).max(200),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
  contentType: z.literal("application/pdf"),
});

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request)))
      return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    const input = schema.parse(await request.json());
    const objectKey = `incoming/${crypto.randomUUID()}.pdf`;
    await prisma.uploadTicket.create({ data: { objectKey, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    const config = env();
    return Response.json({
      endpoint: `${config.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      bucketName: "product-pdfs",
      objectKey,
      authorization: config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      fileName: input.fileName,
      expiresInSeconds: 1800,
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "25MB 이하 PDF 파일만 업로드할 수 있습니다."
        : error instanceof Error
          ? error.message
          : "업로드 준비 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
