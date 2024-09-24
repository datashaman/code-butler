DROP TABLE `facts`;--> statement-breakpoint
ALTER TABLE `projects` ADD `facts` text DEFAULT '[]' NOT NULL;