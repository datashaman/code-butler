import { z } from "zod"

export const projectSchema = z.object({
  name: z.string().min(1).max(255),
  path: z.string().min(1),
  assistantId: z.string().min(1),
  description: z.string().max(1000),
  facts: z.array(z.string()).optional(),
  threadId: z.string().optional(),
})
