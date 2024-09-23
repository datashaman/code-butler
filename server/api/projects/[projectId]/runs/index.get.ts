import OpenAI from "openai"
import { useValidatedParams, useValidatedBody, z, zh } from "h3-zod"

export default defineEventHandler(async (event) => {
  const { projectId } = await useValidatedParams(event, {
    projectId: zh.intAsString,
  })

  const project = useDB()
    .select()
    .from(tables.projects)
    .where(eq(tables.projects.id, projectId))
    .get()

  const openai = new OpenAI()
  const runs = []

  for await (const run of openai.beta.threads.runs.list(project.threadId, {
    order: "asc",
  })) {
    runs.push(run)
  }

  return { runs }
})
