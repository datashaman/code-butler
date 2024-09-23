import { projects } from "~/database/schema"
import { asc } from "drizzle-orm"
import { useValidatedParams, useValidatedBody, z, zh } from "h3-zod"

export default defineEventHandler(async (event) => {
  const { projectId } = await useValidatedParams(event, {
    projectId: zh.intAsString,
  })

  const project = useDB()
    .select()
    .from(tables.projects)
    .where(eq(tables.projects.id, projectId))
    .limit(1)
    .get()

  if (!project) {
    throw createError({
      statusCode: 404,
      message: "Project not found",
    })
  }

  return {
    project,
  }
})
