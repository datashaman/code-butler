import { useValidatedParams, z } from "h3-zod"
import OpenAI from "openai"

export default defineEventHandler(async (event) => {
  const { assistantId } = await useValidatedParams(event, {
    assistantId: z.string(),
  })

  const openai = new OpenAI()
  const assistant = await openai.beta.assistants.del(assistantId)

  return {
    assistant,
  }
})
