import { projects } from "~/database/schema"
import { asc } from "drizzle-orm"
import { useValidatedParams, useValidatedBody, z, zh } from "h3-zod"

export default defineEventHandler(async (event) => {
  const { projectId } = await useValidatedParams(event, {
    projectId: zh.intAsString,
  })

  const actions = useDB()
    .select()
    .from(tables.actions)
    .where(eq(tables.actions.projectId, projectId))
    .orderBy(asc(tables.actions.createdAt))
    .all()

  return {
    actions,
  }
})
