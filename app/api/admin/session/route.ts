import { ADMIN_COOKIE, createAdminSession, getAdminEmail, isAdminRequest } from "../../../../lib/admin-auth";
import { consumeEmailToken } from "../../../../lib/email-verification";

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdminRequest(request) });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; emailVerificationToken?: string };
    const email = payload.email?.trim().toLowerCase() ?? "";
    if (!email || email !== getAdminEmail() || !payload.emailVerificationToken) {
      return Response.json({ error: "관리자 인증 정보를 확인해 주세요." }, { status: 403 });
    }
    if (!(await consumeEmailToken(email, payload.emailVerificationToken))) {
      return Response.json({ error: "관리자 인증이 만료되었거나 이미 사용되었습니다." }, { status: 403 });
    }
    const session = await createAdminSession();
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return Response.json(
      { authenticated: true },
      {
        headers: {
          "Set-Cookie": `${ADMIN_COOKIE}=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure}`,
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "관리자 로그인 중 문제가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  return Response.json(
    { authenticated: false },
    {
      headers: { "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` },
    },
  );
}
