import OpenAI from "openai"

export default defineEventHandler(async (event) => {
  const openai = new OpenAI()
  const messages = []

  for await (const message of openai.beta.threads.messages.list(
    getRouterParam(event, "threadId"),
    {
      ...getQuery(event),
      order: "asc",
    },
  )) {
    messages.push(message)
  }

  return {
    messages,
  }
})
