import { z } from "zod"

export const assistantSchema = z.object({
  model: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  instructions: z.string().max(1000),
  temperature: z.coerce.number().min(0).max(2).default(1),
  tools: z.array(z.string()).default([]),
})
