import { z } from "zod"

export const assistantSchema = z.object({
  model: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().max(1000),
  instructions: z.string().max(1000),
  temperature: z.number().min(0).max(2).default(1),
})
