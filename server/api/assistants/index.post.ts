import { useValidatedBody, z } from "h3-zod"
import OpenAI from "openai"
import { assistantSchema } from "~/schemas/assistantSchema"

export default defineEventHandler(async (event) => {
  const values = await useValidatedBody(event, assistantSchema)

  const openai = new OpenAI()
  const assistant = await openai.beta.assistants.create(values)

  return {
    assistant,
  }
})
