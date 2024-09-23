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

  const runningStatuses = ["queued", "in_progress", "requires_action"]

  for await (const run of openai.beta.threads.runs.list(project.threadId, {
    order: "asc",
  })) {
    run.tools = run.tools.map((tool) => tool.function.name)

    if (runningStatuses.includes(run.status)) {
      const steps = []

      for await (const step of openai.beta.threads.runs.steps.list(
        project.threadId,
        run.id,
        {
          order: "asc",
        },
      )) {
        steps.push(step)
      }

      run.steps = steps
    }

    runs.push(run)
  }

  return { runs }
})
