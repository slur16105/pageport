// 이 파일은 관리자가 큰 PDF를 중단 후 재개 방식으로 올릴 수 있는 30분짜리 업로드 권한을 만듭니다.
import { z } from "zod";
import { isAdminRequest } from "../../../../../lib/admin-auth";
import { env } from "../../../../../lib/env";
import { prisma } from "../../../../../lib/prisma";
import { PRIVATE_PDF_BUCKET } from "../../../../../lib/supabase";

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

    // Supabase TUS는 점(.)으로 세 부분이 나뉜 JWT만 Bearer 인증값으로 받습니다.
    if (!authorization || authorization.split(".").length !== 3) {
      return Response.json(
        { code: "TUS_UPLOAD_AUTH_INVALID", error: "PDF 저장소 연결을 확인한 뒤 다시 시도해 주세요." },
        { status: 503 },
      );
    }

    // 임의의 임시 저장 위치와 짧은 만료 시간을 사용해 허가받지 않은 업로드를 막습니다.
    const objectKey = `incoming/${crypto.randomUUID()}.pdf`;
    await prisma.uploadTicket.create({ data: { objectKey, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    return Response.json({
      endpoint: `${config.NEXT_PUBLIC_SUPABASE_URL.replace(".supabase.co", ".storage.supabase.co")}/storage/v1/upload/resumable`,
      bucketName: PRIVATE_PDF_BUCKET,
      objectKey,
      authorization,
      fileName: input.fileName,
      expiresInSeconds: 1800,
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json({ error: "25MB 이하 PDF 파일만 업로드할 수 있습니다." }, { status: 400 });

    // 내부 서비스의 상세 오류는 기록만 남기고 관리자 화면에는 쉬운 안내만 보냅니다.
    console.error("PDF upload ticket creation failed", error);
    return Response.json(
      { code: "UPLOAD_PREPARATION_FAILED", error: "PDF 업로드를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
