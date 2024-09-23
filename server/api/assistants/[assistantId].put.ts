import { useValidatedParams, useValidatedBody, z } from "h3-zod"
import OpenAI from "openai"
import { assistantSchema } from "~/schemas/assistantSchema"
import { useTools } from "~/composables/useTools"

export default eventHandler(async (event) => {
  const tools = await useTools({})

  const { assistantId } = await useValidatedParams(event, {
    assistantId: z.string(),
  })

  const values = await useValidatedBody(event, assistantSchema)
  values.tools = tools.getTools(values.tools)

  const openai = new OpenAI()
  const assistant = await openai.beta.assistants.update(assistantId, values)

  return {
    assistant,
  }
})
