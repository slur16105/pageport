// 이 파일은 서버가 Supabase 저장소를 관리할 때 쓰는 전용 연결과 버킷 이름을 제공합니다.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: ReturnType<typeof createClient> | undefined;

export function supabaseAdmin() {
  // 관리자 비밀키는 브라우저에 공개하지 않고 서버 안에서만 사용합니다.
  const config = env();
  client ??= createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const PRIVATE_PDF_BUCKET = "product-pdfs";
export const PUBLIC_PREVIEW_BUCKET = "product-previews";
