// 이 파일은 관리자 로그인 상태 확인, 로그인 완료, 로그아웃 요청을 처리합니다.
import { ADMIN_COOKIE, createAdminSession, isAdminEmail, isAdminRequest } from "../../../../lib/admin-auth";
import { consumeEmailToken } from "../../../../lib/email-verification";

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdminRequest(request) });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; emailVerificationToken?: string };
    const email = payload.email?.trim().toLowerCase() ?? "";
    if (!email || !isAdminEmail(email) || !payload.emailVerificationToken) {
      return Response.json({ error: "관리자 인증 정보를 확인해 주세요." }, { status: 403 });
    }
    if (!(await consumeEmailToken(email, payload.emailVerificationToken))) {
      return Response.json({ error: "관리자 인증이 만료되었거나 이미 사용되었습니다." }, { status: 403 });
    }
    // 인증에 성공하면 브라우저에서 내용을 읽을 수 없는 보안 쿠키로 12시간 로그인을 유지합니다.
    const session = await createAdminSession(email);
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
