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

  const eventsToForward = [
    "thread.message.delta",
    "thread.run.created",
    "thread.run.queued",
    "thread.run.in_progress",
    "thread.run.requires_action",
    "thread.run.completed",
    "thread.run.incomplete",
    "thread.run.failed",
    "thread.run.cancelling",
    "thread.run.cancelled",
    "thread.run.expired",
  ]

  const observeRunStream = async (stream, controller) => {
    stream
      .on("event", (evt) => {
        if (eventsToForward.includes(evt.event)) {
          const str = JSON.stringify(evt) + "\n"
          controller.enqueue(new TextEncoder().encode(str))
        }
      })
      .on("end", async () => {
        const run = stream.currentRun()

        if (
          run.status === "requires_action" &&
          run.required_action.type === "submit_tool_outputs"
        ) {
          await observeRunStream(
            openai.beta.threads.runs.submitToolOutputsStream(
              run.thread_id,
              run.id,
              {
                tool_outputs: await Promise.all(
                  run.required_action.submit_tool_outputs.tool_calls.map(
                    async (toolCall) => {
                      try {
                        const output = await tools.handleToolCall(toolCall)

                        return {
                          tool_call_id: toolCall.id,
                          output: JSON.stringify(output),
                        }
                      } catch (e) {
                        return {
                          tool_call_id: toolCall.id,
                          output: JSON.stringify({
                            success: false,
                            error: e.message,
                          }),
                        }
                      }
                    },
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
      const facts = project.facts || []
      const params = {
        ...(await readBody(event)),
        additional_instructions:
          project.description + "\n\nProject Facts: " + facts.join("\n"),
        assistant_id: project.assistantId,
        tools: tools.allTools(),
      }

      const stream = openai.beta.threads.runs.stream(project.threadId, params)

      await observeRunStream(stream, controller)
    },
  })

  return sendStream(event, stream)
})
