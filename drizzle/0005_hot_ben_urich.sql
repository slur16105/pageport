CREATE TABLE `catalog_products` (
	`slug` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`seller_name` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`rating` text DEFAULT '0.0' NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`accent` text DEFAULT 'mint' NOT NULL,
	`mark` text NOT NULL,
	`pages` integer NOT NULL,
	`file_size` text NOT NULL,
	`summary` text NOT NULL,
	`includes_json` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_catalog_products_status_updated_at` ON `catalog_products` (`status`,`updated_at`);