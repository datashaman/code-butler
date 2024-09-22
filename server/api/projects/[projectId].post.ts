import OpenAI from "openai"
import { useTools } from "~/composables/useTools"
import { useValidatedParams, z, zh } from "h3-zod"

export default defineEventHandler(async (event) => {
  const { projectId } = await useValidatedParams(event, {
    projectId: zh.intAsString,
  })

  const project = useDB()
    .select()
    .from(tables.projects)
    .where(eq(tables.projects.id, projectId))
    .limit(1)
    .get()

  const tools = await useTools(project)
  const openai = new OpenAI()

  const observeRunStream = async (stream, controller) => {
    stream
      .on("messageDelta", (delta) => {
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify(delta) + "\n"),
        )
      })
      .on("end", async () => {
        const run = stream.currentRun()

        if (
          run.status === "requires_action" &&
          run.required_action.type === "submit_tool_outputs"
        ) {
          observeRunStream(
            openai.beta.threads.runs.submitToolOutputsStream(
              run.thread_id,
              run.id,
              {
                tool_outputs: await Promise.all(
                  run.required_action.submit_tool_outputs.tool_calls.map(
                    async (toolCall) => ({
                      tool_call_id: toolCall.id,
                      output: JSON.stringify(
                        await tools.handleToolCall(toolCall),
                      ),
                    }),
                  ),
                ),
              },
            ),
            controller,
          )
        } else {
          controller.close()
        }
      })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const params = {
        ...(await readBody(event)),
        additional_instructions: project.description,
        assistant_id: project.assistantId,
        tools: tools.allTools(),
      }

      const stream = openai.beta.threads.runs.stream(project.threadId, params)

      observeRunStream(stream, controller)
    },
  })

  return sendStream(event, stream)
})
