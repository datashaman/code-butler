import OpenAI from "openai"

export default defineEventHandler(async (event) => {
  const openai = new OpenAI()

  const thread = await openai.beta.threads.create(await readBody(event))

  return {
    thread,
  }
})
