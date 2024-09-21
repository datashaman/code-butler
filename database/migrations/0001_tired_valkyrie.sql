CREATE TABLE `actions` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`tool` text DEFAULT 'New Action' NOT NULL,
	`args` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `description` text DEFAULT '' NOT NULL;