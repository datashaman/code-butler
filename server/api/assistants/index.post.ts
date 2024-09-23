import { useValidatedBody, z } from "h3-zod"
import OpenAI from "openai"
import { useTools } from "~/composables/useTools"
import { assistantSchema } from "~/schemas/assistantSchema"

export default defineEventHandler(async (event) => {
  const tools = await useTools({})
  const values = await useValidatedBody(event, assistantSchema)

  values.tools = tools.getTools(values.tools)

  const openai = new OpenAI()
  const assistant = await openai.beta.assistants.create(values)

  return {
    assistant,
  }
})
