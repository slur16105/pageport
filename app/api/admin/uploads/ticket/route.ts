// 이 파일은 관리자가 큰 PDF를 중단 후 재개 방식으로 올릴 수 있는 30분짜리 업로드 권한을 만듭니다.
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
    const config = env();
    const authorization = config.SUPABASE_TUS_ANON_KEY;
    // 새 publishable 키는 JWT가 아니므로 TUS의 Bearer 인증값으로 사용할 수 없습니다.
    if (!authorization || authorization.split(".").length !== 3) {
      return Response.json(
        {
          code: "TUS_UPLOAD_AUTH_INVALID",
          error: "PDF 저장소 인증 설정을 확인해 주세요.",
        },
        { status: 503 },
      );
    }
    // 임의의 임시 저장 위치와 짧은 만료 시간을 사용해 허가받지 않은 업로드를 막습니다.
    const objectKey = `incoming/${crypto.randomUUID()}.pdf`;
    await prisma.uploadTicket.create({ data: { objectKey, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    return Response.json({
      endpoint: `${config.NEXT_PUBLIC_SUPABASE_URL.replace(".supabase.co", ".storage.supabase.co")}/storage/v1/upload/resumable`,
      bucketName: "product-pdfs",
      objectKey,
      authorization,
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
