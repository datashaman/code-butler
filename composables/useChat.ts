import { ref, watch, type Ref } from "vue"

export function useChat() {
  const runStore = useRunStore()
  const runtimeConfig = useRuntimeConfig()
  const messages = ref<{ role: string; content: string }[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const messagesContainer = ref<HTMLElement | null>(null)

  const onMessageCallbacks: Ref<
    ((message: { role: string; content: string }) => void)[]
  > = ref([])

  watch(
    messages,
    (newMessages) => {
      const latestMessage = newMessages[newMessages.length - 1]
      if (latestMessage) {
        onMessageCallbacks.value.forEach((callback) => callback(latestMessage))
      }
    },
    { deep: true },
  )

  const onMessage = (
    callback: (message: { role: string; content: string }) => void,
  ) => {
    onMessageCallbacks.value.push(callback)
  }

  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }

  const sendMessage = async (project, content: string, model: string) => {
    isLoading.value = true
    error.value = null

    messages.value.push({
      role: "user",
      content: [
        {
          type: "text",
          text: {
            value: content,
          },
        },
      ],
    })

    nextTick(() => {
      scrollToBottom()
    })

    const assistantContent = ref("...")

    messages.value.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: {
            value: assistantContent,
          },
        },
      ],
    })

    nextTick(() => {
      scrollToBottom()
    })

    try {
      const body = {
        additional_messages: [
          {
            role: "user",
            content,
          },
        ],
      }

      if (model !== "assistant") {
        body.model = model
      }

      const params = {
        method: "POST",
        body: JSON.stringify(body),
        responseType: "stream",
        tools: ["getCurrentTime"],
      }

      const response = await $fetch(`/api/projects/${project.id}`, params)
      const reader = response.pipeThrough(new TextDecoderStream()).getReader()

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        value
          .trim()
          .split("\n")
          .forEach((evt) => {
            const parsed = JSON.parse(evt)
            console.log(evt)
            switch (parsed.event) {
              case "thread.message.delta":
                const delta = parsed.data.delta
                console.log(delta)

                if (assistantContent.value === "...") {
                  assistantContent.value = ""
                }

                assistantContent.value += delta.content[0].text.value
                scrollToBottom()
                break
              case "thread.run.created":
              case "thread.run.queued":
              case "thread.run.in_progress":
              case "thread.run.requires_action":
              case "thread.run.completed":
              case "thread.run.incomplete":
              case "thread.run.failed":
              case "thread.run.cancelling":
              case "thread.run.cancelled":
              case "thread.run.expired":
                runStore.handleEvent(parsed)
            }
          })
      }
    } catch (err: any) {
      error.value = err.message || "Unknown error occurred"

      setTimeout(() => {
        error.value = null
      }, 3000)
    } finally {
      isLoading.value = false
    }
  }

  const fetchMessages = async (threadId) => {
    let url = `/api/threads/${threadId}/messages`

    isLoading.value = true
    error.value = null

    /*
    const after =
      messages.value.length > 0
        ? messages.value[messages.value.length - 1].id
        : null;

    url += `?after=${after}`;
    */

    try {
      const { data } = await useFetch(url)
      const { messages: messagesValue } = data.value
      messages.value = messagesValue
      scrollToBottom()
    } catch (err: any) {
      error.value = err.message || "Unknown error occurred"

      setTimeout(() => {
        error.value = null
      }, 3000)
    } finally {
      isLoading.value = false
    }
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    onMessage,
    fetchMessages,
    messagesContainer,
    scrollToBottom,
  }
}
