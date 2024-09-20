import OpenAI from "openai"
import { useTools } from "@/composables/useTools"

export default defineEventHandler(async (event) => {
  const tools = await useTools()
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
      const stream = openai.beta.threads.runs.stream(
        getRouterParam(event, "threadId"),
        {
          ...(await readBody(event)),
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
          tools: tools.allTools(),
        },
      )

      observeRunStream(stream, controller)
    },
  })

  return sendStream(event, stream)
})
