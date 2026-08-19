import { getD1 } from ".";

export async function ensureDownloadGrantsSchema() {
  const d1 = getD1();
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS download_grants (
      order_id text PRIMARY KEY NOT NULL,
      product_slug text NOT NULL,
      object_key text NOT NULL,
      expires_at integer NOT NULL,
      download_count integer DEFAULT 0 NOT NULL,
      last_downloaded_at integer,
      created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_download_grants_expires_at ON download_grants (expires_at)"),
    d1.prepare("PRAGMA optimize"),
  ]);
}
