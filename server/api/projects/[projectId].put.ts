import { eq, and } from "drizzle-orm"
import { useValidatedParams, useValidatedBody, z, zh } from "h3-zod"

export default eventHandler(async (event) => {
  const { projectId } = await useValidatedParams(event, {
    projectId: zh.intAsString,
  })

  const values = await useValidatedBody(event, {
    name: z.string().min(1).max(255),
    path: z.string().min(1).max(255),
    description: z.string().max(1000),
  })

  const project = useDB()
    .update(tables.projects)
    .set(values)
    .where(eq(tables.projects.id, projectId))
    .returning()
    .get()

  return {
    project,
  }
})
