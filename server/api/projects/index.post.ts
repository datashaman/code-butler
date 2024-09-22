import { useValidatedBody, z } from "h3-zod"
import { OpenAI } from "openai"
import { projectSchema } from "~/schemas/projectSchema"

export default eventHandler(async (event) => {
  const values = await useValidatedBody(event, projectSchema)

  const openai = new OpenAI()

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
