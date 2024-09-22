import OpenAI from "openai"

export default defineEventHandler(async (event) => {
  const openai = new OpenAI()

  const assistants = []

  for await (const assistant of openai.beta.assistants.list()) {
    assistants.push(assistant)
  }

  return { assistants }
})
