import type { Config } from "drizzle-kit"

export default {
  dbCredentials: {
      url: "./database/db.sqlite",
  },
  dialect: "sqlite",
  out: "./database/migrations",
  schema: "./database/schema.ts",
} satisfies Config
