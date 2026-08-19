import { getD1 } from ".";

export async function ensureOrdersSchema() {
  const d1 = getD1();
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id text PRIMARY KEY NOT NULL,
      product_slug text NOT NULL,
      product_title text NOT NULL,
      seller_name text NOT NULL,
      buyer_email text NOT NULL,
      amount integer NOT NULL,
      currency text DEFAULT 'KRW' NOT NULL,
      status text DEFAULT 'test_pending' NOT NULL,
      is_test integer DEFAULT true NOT NULL,
      email_verified_at text NOT NULL,
      payment_key text,
      approved_at text,
      receipt_email_sent_at text,
      receipt_email_id text,
      total_download_count integer DEFAULT 0 NOT NULL,
      refunded_at text,
      refund_reason text,
      refund_email_sent_at text,
      refund_email_id text,
      created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_orders_buyer_email_created_at ON orders (buyer_email, created_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at)"),
    d1.prepare("PRAGMA optimize"),
  ]);

  const columns = await d1.prepare("PRAGMA table_info(orders)").all<{ name: string }>();
  const columnNames = new Set(columns.results.map((column) => column.name));
  const additions: D1PreparedStatement[] = [];
  if (!columnNames.has("payment_key")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN payment_key text"));
  if (!columnNames.has("approved_at")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN approved_at text"));
  if (!columnNames.has("receipt_email_sent_at")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN receipt_email_sent_at text"));
  if (!columnNames.has("receipt_email_id")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN receipt_email_id text"));
  if (!columnNames.has("total_download_count")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN total_download_count integer DEFAULT 0 NOT NULL"));
  if (!columnNames.has("refunded_at")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN refunded_at text"));
  if (!columnNames.has("refund_reason")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN refund_reason text"));
  if (!columnNames.has("refund_email_sent_at")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN refund_email_sent_at text"));
  if (!columnNames.has("refund_email_id")) additions.push(d1.prepare("ALTER TABLE orders ADD COLUMN refund_email_id text"));
  if (additions.length) await d1.batch(additions);
}
