import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: ReturnType<typeof createClient> | undefined;

export function supabaseAdmin() {
  const config = env();
  client ??= createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const PRIVATE_PDF_BUCKET = "product-pdfs";
export const PUBLIC_PREVIEW_BUCKET = "product-previews";
