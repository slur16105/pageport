import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    productSlug: text("product_slug").notNull(),
    productTitle: text("product_title").notNull(),
    sellerName: text("seller_name").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("KRW"),
    status: text("status").notNull().default("test_pending"),
    isTest: integer("is_test", { mode: "boolean" }).notNull().default(true),
    emailVerifiedAt: text("email_verified_at").notNull(),
    paymentKey: text("payment_key"),
    approvedAt: text("approved_at"),
    receiptEmailSentAt: text("receipt_email_sent_at"),
    receiptEmailId: text("receipt_email_id"),
    totalDownloadCount: integer("total_download_count").notNull().default(0),
    refundedAt: text("refunded_at"),
    refundReason: text("refund_reason"),
    refundEmailSentAt: text("refund_email_sent_at"),
    refundEmailId: text("refund_email_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_orders_buyer_email_created_at").on(table.buyerEmail, table.createdAt),
    index("idx_orders_status_created_at").on(table.status, table.createdAt),
  ],
);

export const emailVerifications = sqliteTable(
  "email_verifications",
  {
    email: text("email").primaryKey(),
    codeHash: text("code_hash").notNull(),
    verificationTokenHash: text("verification_token_hash"),
    expiresAt: integer("expires_at").notNull(),
    lastSentAt: integer("last_sent_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    verifiedAt: integer("verified_at"),
  },
  (table) => [index("idx_email_verifications_expires_at").on(table.expiresAt)],
);

export const downloadGrants = sqliteTable(
  "download_grants",
  {
    orderId: text("order_id").primaryKey(),
    productSlug: text("product_slug").notNull(),
    objectKey: text("object_key").notNull(),
    expiresAt: integer("expires_at").notNull(),
    downloadCount: integer("download_count").notNull().default(0),
    lastDownloadedAt: integer("last_downloaded_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_download_grants_expires_at").on(table.expiresAt)],
);

export const catalogProducts = sqliteTable(
  "catalog_products",
  {
    slug: text("slug").primaryKey(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    sellerName: text("seller_name").notNull(),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    rating: text("rating").notNull().default("0.0"),
    reviews: integer("reviews").notNull().default(0),
    accent: text("accent").notNull().default("mint"),
    mark: text("mark").notNull(),
    pages: integer("pages").notNull(),
    fileSize: text("file_size").notNull(),
    summary: text("summary").notNull(),
    includesJson: text("includes_json").notNull(),
    status: text("status").notNull().default("draft"),
    objectKey: text("object_key").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_catalog_products_status_updated_at").on(table.status, table.updatedAt)],
);
