import OpenAI from "openai"

export default defineEventHandler(async (event) => {
  const openai = new OpenAI()

  const message = await openai.beta.threads.messages.create(
    getRouterParam(event, "threadId"),
    await readBody(event),
  )

  return {
    message,
  }
})
