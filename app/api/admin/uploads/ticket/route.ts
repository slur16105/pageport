// 이 파일은 관리자가 큰 PDF를 중단 후 재개 방식으로 올릴 수 있는 30분짜리 업로드 권한을 만듭니다.
import { z } from "zod";
import { isAdminRequest } from "../../../../../lib/admin-auth";
import { env } from "../../../../../lib/env";
import { prisma } from "../../../../../lib/prisma";
import { PRIVATE_PDF_BUCKET, supabaseAdmin } from "../../../../../lib/supabase";

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
    // 임의의 임시 저장 위치와 짧은 만료 시간을 사용해 허가받지 않은 업로드를 막습니다.
    const objectKey = `incoming/${crypto.randomUUID()}.pdf`;

    // Supabase의 공개 키는 로그인 증명서(JWT)가 아니므로 Authorization에 넣을 수 없습니다.
    // 대신 서버 비밀키로 이 파일 한 개에만 쓸 수 있는 업로드 전용 서명을 발급합니다.
    const { data: signedUpload, error: signedUploadError } = await supabaseAdmin()
      .storage.from(PRIVATE_PDF_BUCKET)
      .createSignedUploadUrl(objectKey, { upsert: true });
    if (signedUploadError || !signedUpload?.token)
      throw new Error(signedUploadError?.message ?? "업로드 전용 권한을 만들지 못했습니다.");

    await prisma.uploadTicket.create({ data: { objectKey, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    const config = env();
    return Response.json({
      endpoint: `${config.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      bucketName: PRIVATE_PDF_BUCKET,
      objectKey,
      signature: signedUpload.token,
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
