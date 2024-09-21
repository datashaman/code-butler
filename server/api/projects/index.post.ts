import { useValidatedBody, z } from "h3-zod"
import { OpenAI } from "openai"

export default eventHandler(async (event) => {
  const openai = new OpenAI()

  const values = await useValidatedBody(event, {
    description: z.string().optional(),
    name: z.string().min(1).max(100),
    path: z.string().min(1),
  })

  const thread = await openai.beta.threads.create({})
  values.threadId = thread.id

  const project = useDB()
    .insert(tables.projects)
    .values(values)
    .returning()
    .get()

  return {
    project,
  }
})
