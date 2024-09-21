import { eq, and } from "drizzle-orm"
import { useValidatedParams, zh } from "h3-zod"

export default eventHandler(async (event) => {
  const { projectId } = await useValidatedParams(event, {
    projectId: zh.intAsString,
  })

  const project = useDB()
    .delete(tables.projects)
    .where(eq(tables.projects.id, projectId))
    .returning()
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
