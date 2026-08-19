import { getD1 } from ".";

export async function ensureEmailVerificationsSchema() {
  const d1 = getD1();
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS email_verifications (
      email text PRIMARY KEY NOT NULL,
      code_hash text NOT NULL,
      verification_token_hash text,
      expires_at integer NOT NULL,
      last_sent_at integer NOT NULL,
      attempts integer DEFAULT 0 NOT NULL,
      verified_at integer
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications (expires_at)"),
    d1.prepare("PRAGMA optimize"),
  ]);
}
