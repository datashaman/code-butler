import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "~/database/schema"

export { sql, eq, and, or } from "drizzle-orm"
export const tables = schema

export function useDB() {
  const sqlite = new Database("./database/db.sqlite")

  return drizzle(sqlite, { schema })
}
