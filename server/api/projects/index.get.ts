import { projects } from "@/database/schema"
import { asc } from "drizzle-orm"

export default defineEventHandler(async () => {
  const projects = useDB()
    .select()
    .from(tables.projects)
    .orderBy(asc(tables.projects.name))
    .all()

  return {
    projects,
  }
})
