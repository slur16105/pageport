CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`product_slug` text NOT NULL,
	`product_title` text NOT NULL,
	`seller_name` text NOT NULL,
	`buyer_email` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'KRW' NOT NULL,
	`status` text DEFAULT 'test_pending' NOT NULL,
	`is_test` integer DEFAULT true NOT NULL,
	`email_verified_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_buyer_email_created_at` ON `orders` (`buyer_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_status_created_at` ON `orders` (`status`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
