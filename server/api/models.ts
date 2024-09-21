import OpenAI from "openai"

export default defineEventHandler(async (event) => {
  const openai = new OpenAI()
  const { data: models } = await openai.models.list()

  const allowedModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4o-2024-08-06",
    "gpt-3.5-turbo",
  ]

  // sort them in the same order as allowedModels
  return {
    models: models
      .filter((model) => allowedModels.includes(model.id))
      .map((model) => model.id)
      .sort((a, b) => allowedModels.indexOf(a) - allowedModels.indexOf(b)),
  }
})
