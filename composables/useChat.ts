import { ref, watch, type Ref } from "vue"

export function useChat() {
  const runtimeConfig = useRuntimeConfig()
  const messages = ref<{ role: string; content: string }[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const messagesContainer = ref<HTMLElement | null>(null)

  const onMessageCallbacks: Ref<
    ((message: { role: string; content: string }) => void)[]
  > = ref([])

  const threadId = runtimeConfig.public.threadId

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

  const sendMessage = async (content: string) => {
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
      const params = {
        method: "POST",
        body: JSON.stringify({
          additional_messages: [
            {
              role: "user",
              content,
            },
          ],
        }),
        responseType: "stream",
        tools: ["getCurrentTime"],
      }

      const response = await $fetch(`/api/threads/${threadId}/runs`, params)
      const reader = response.pipeThrough(new TextDecoderStream()).getReader()

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        value
          .trim()
          .split("\n")
          .forEach((event) => {
            if (event) {
              const delta = JSON.parse(event).content[0].text.value

              if (assistantContent.value === "...") {
                assistantContent.value = ""
              }

              assistantContent.value += delta
              scrollToBottom()
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

  const fetchMessages = async () => {
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
      const { messages: data } = await $fetch(url)

      // messages.value = [...messages.value, ...data];
      messages.value = data
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
