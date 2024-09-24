import OpenAI from "openai"
import { useValidatedParams, useValidatedBody, z, zh } from "h3-zod"

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
  const steps = []

  for await (const step of openai.beta.threads.runs.steps.list(
    project.threadId,
    runId,
    {
      order: "asc",
    },
  )) {
    steps.push(step)
  }

  return { steps }
})
