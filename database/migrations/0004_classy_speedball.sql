CREATE TABLE `facts` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
