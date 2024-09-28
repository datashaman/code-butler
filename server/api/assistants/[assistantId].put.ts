import { useValidatedParams, useValidatedBody, z } from "h3-zod"
import OpenAI from "openai"
import { assistantSchema } from "~/schemas/assistantSchema"

export default eventHandler(async (event) => {
  const { assistantId } = await useValidatedParams(event, {
    assistantId: z.string(),
  })

  const values = await useValidatedBody(event, assistantSchema)

  const openai = new OpenAI()
  const assistant = await openai.beta.assistants.update(assistantId, values)

  return {
    assistant,
  }
})
