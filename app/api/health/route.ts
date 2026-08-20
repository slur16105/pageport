// 이 파일은 배포된 서버와 데이터베이스가 정상인지 외부 점검 도구에 간단히 알려 줍니다.
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // 실제 자료를 읽지 않고 가장 가벼운 명령으로 데이터베이스 연결만 확인합니다.
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", service: "PAGEPORT" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { status: "degraded", service: "PAGEPORT" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
