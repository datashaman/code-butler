CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'New Project' NOT NULL,
	`path` text NOT NULL,
	`thread_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_unique` ON `projects` (`name`);