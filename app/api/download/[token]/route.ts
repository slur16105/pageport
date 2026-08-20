import { Prisma } from "@prisma/client";
import { hashDownloadToken } from "../../../../lib/download-links";
import { prisma } from "../../../../lib/prisma";
import { privacyHash, requestIp } from "../../../../lib/request-security";
import { PRIVATE_PDF_BUCKET, supabaseAdmin } from "../../../../lib/supabase";

type Props = { params: Promise<{ token: string }> };

function downloadError(request: Request, reason: string, message: string, status: number) {
  if (request.headers.get("accept")?.includes("text/html")) {
    const url = new URL("/downloads/unavailable", request.url);
    url.searchParams.set("reason", reason);
    return new Response(null, {
      status: 303,
      headers: { Location: url.toString(), "Cache-Control": "private, no-store" },
    });
  }
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request, { params }: Props) {
  try {
    const token = decodeURIComponent((await params).token);
    const result = await prisma.$queryRaw<
      Array<{ object_key: string; order_id: string; download_count: number }>
    >(Prisma.sql`
      SELECT * FROM public.consume_download_grant(${hashDownloadToken(token)}, ${privacyHash(requestIp(request))}, ${request.headers.get("user-agent")})
    `);
    const record = result[0];
    if (!record) return downloadError(request, "unavailable", "다운로드 권한을 확인할 수 없습니다.", 403);
    const { data, error } = await supabaseAdmin()
      .storage.from(PRIVATE_PDF_BUCKET)
      .createSignedUrl(record.object_key, 60, { download: record.object_key.split("/").at(-1) ?? "pageport.pdf" });
    if (error || !data?.signedUrl) return downloadError(request, "missing", "PDF 파일을 찾을 수 없습니다.", 404);
    return new Response(null, {
      status: 303,
      headers: { Location: data.signedUrl, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF 다운로드 중 문제가 발생했습니다.";
    const reason = /REFUNDED|REVOKED|ORDER_UNAVAILABLE/.test(message)
      ? "refunded"
      : /EXPIRED/.test(message)
        ? "expired"
        : /LIMIT/.test(message)
          ? "limit"
          : "unavailable";
    return downloadError(
      request,
      reason,
      "다운로드 주소가 만료되었거나 사용할 수 없습니다.",
      reason === "unavailable" ? 403 : 410,
    );
  }
}
