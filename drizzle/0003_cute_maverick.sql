CREATE TABLE `download_grants` (
	`order_id` text PRIMARY KEY NOT NULL,
	`product_slug` text NOT NULL,
	`object_key` text NOT NULL,
	`expires_at` integer NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	`last_downloaded_at` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_download_grants_expires_at` ON `download_grants` (`expires_at`);--> statement-breakpoint
PRAGMA optimize;
