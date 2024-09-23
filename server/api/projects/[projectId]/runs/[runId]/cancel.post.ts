import OpenAI from "openai"
import { useValidatedParams, z, zh } from "h3-zod"

export default defineEventHandler(async (event) => {
  const { projectId, runId } = await useValidatedParams(event, {
    projectId: zh.intAsString,
    runId: z.string(),
  })

  const project = useDB()
    .select()
    .from(tables.projects)
    .where(eq(tables.projects.id, projectId))
    .limit(1)
    .get()

  const openai = new OpenAI()
  const run = await openai.beta.threads.runs.cancel(project.threadId, runId)

  return { run }
})
