import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique().default("New Project"),
  path: text("path").notNull(),
  threadId: text("thread_id").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
})

export type Project = InferSelectModel<typeof projects>
export type InsertProject = InferInsertModel<typeof projects>
