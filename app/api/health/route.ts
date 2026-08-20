import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", service: "PAGEPORT" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { status: "degraded", service: "PAGEPORT" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
