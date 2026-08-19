ALTER TABLE `orders` ADD `payment_key` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `approved_at` text;--> statement-breakpoint
PRAGMA optimize;
