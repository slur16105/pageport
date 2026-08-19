CREATE TABLE `email_verifications` (
	`email` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`verification_token_hash` text,
	`expires_at` integer NOT NULL,
	`last_sent_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`verified_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_email_verifications_expires_at` ON `email_verifications` (`expires_at`);--> statement-breakpoint
PRAGMA optimize;
