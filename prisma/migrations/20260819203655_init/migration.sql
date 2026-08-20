-- PAGEPORT의 첫 데이터베이스 구조를 만드는 변경 기록입니다.
-- 상품, 주문, 이메일 인증, 다운로드, 결제 알림, 예약 작업, 요청 제한 정보를 차례로 만듭니다.

-- 판매할 PDF 상품 정보표입니다.
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seller_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "accent" TEXT NOT NULL DEFAULT 'mint',
    "mark" TEXT NOT NULL,
    "pages" INTEGER NOT NULL,
    "file_size" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "object_key" TEXT NOT NULL,
    "preview_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- 고객의 결제·환불·다운로드 현황을 묶어 보관하는 주문 정보표입니다.
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "product_id" UUID NOT NULL,
    "product_slug" TEXT NOT NULL,
    "product_title" TEXT NOT NULL,
    "seller_name" TEXT NOT NULL,
    "buyer_email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "is_test" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMP(3) NOT NULL,
    "payment_key" TEXT,
    "approved_at" TIMESTAMP(3),
    "receipt_email_sent_at" TIMESTAMP(3),
    "receipt_email_id" TEXT,
    "total_download_count" INTEGER NOT NULL DEFAULT 0,
    "refunded_at" TIMESTAMP(3),
    "refund_reason" TEXT,
    "refund_email_sent_at" TIMESTAMP(3),
    "refund_email_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- 이메일로 보낸 인증번호의 안전한 변환값과 만료 시각을 보관합니다.
CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "verification_token_hash" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_sent_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- 결제한 고객에게 발급한 다운로드 권한과 남은 횟수를 보관합니다.
CREATE TABLE "download_grants" (
    "id" UUID NOT NULL,
    "order_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "max_downloads" INTEGER NOT NULL DEFAULT 5,
    "revoked_at" TIMESTAMP(3),
    "last_downloaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_grants_pkey" PRIMARY KEY ("id")
);

-- 실제 다운로드가 일어난 시점과 접속 정보를 고객지원용으로 기록합니다.
CREATE TABLE "download_events" (
    "id" UUID NOT NULL,
    "order_id" TEXT NOT NULL,
    "grant_id" UUID NOT NULL,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_events_pkey" PRIMARY KEY ("id")
);

-- 토스페이먼츠가 보낸 상태 알림을 중복 없이 처리하기 위한 장부입니다.
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payment_key" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "processed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- 나중에 다시 실행해야 하는 자동 작업과 그 결과를 기록합니다.
CREATE TABLE "job_ledger" (
    "id" UUID NOT NULL,
    "job_key" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_ledger_pkey" PRIMARY KEY ("id")
);

-- 같은 요청이 짧은 시간에 너무 많이 들어오는 것을 막기 위한 횟수표입니다.
CREATE TABLE "request_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_limits_pkey" PRIMARY KEY ("key")
);

-- 아래 색인은 책의 찾아보기처럼 자주 찾는 주문·상품을 빠르게 조회하게 해줍니다.
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_updated_at_idx" ON "products"("status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payment_key_key" ON "orders"("payment_key");

-- CreateIndex
CREATE INDEX "orders_buyer_email_created_at_idx" ON "orders"("buyer_email", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_email_purpose_key" ON "email_verifications"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "download_grants_token_hash_key" ON "download_grants"("token_hash");

-- CreateIndex
CREATE INDEX "download_grants_order_id_created_at_idx" ON "download_grants"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "download_grants_expires_at_idx" ON "download_grants"("expires_at");

-- CreateIndex
CREATE INDEX "download_events_order_id_created_at_idx" ON "download_events"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "webhook_events_status_created_at_idx" ON "webhook_events"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_ledger_job_key_key" ON "job_ledger"("job_key");

-- CreateIndex
CREATE INDEX "job_ledger_status_next_run_at_idx" ON "job_ledger"("status", "next_run_at");

-- CreateIndex
CREATE INDEX "request_limits_expires_at_idx" ON "request_limits"("expires_at");

-- 아래 연결 규칙은 주문·다운로드 기록이 어떤 상품과 주문에 속하는지 보장합니다.
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_grants" ADD CONSTRAINT "download_grants_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_events" ADD CONSTRAINT "download_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_events" ADD CONSTRAINT "download_events_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "download_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
