<script setup lang="ts">
import { Marked } from "marked"
import markedLinkifyIt from "marked-linkify-it"
import DOMPurify from "isomorphic-dompurify"
import { markedHighlight } from "marked-highlight"
import hljs from "highlight.js"
import { formatDistanceToNow } from "date-fns"

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
})

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext"
      return hljs.highlight(code, { language }).value
    },
  }),
)

marked
  .use({
    breaks: true,
  })
  .use(markedLinkifyIt())

const renderMarkdown = (content) => {
  const html = marked.parseInline(content)
  return DOMPurify.sanitize(html)
}

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

const scrollMessages = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
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

  scrollMessages()

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

  scrollMessages()

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
    }

    const response = await $fetch(`/api/projects/${project.id}`, params)
    const reader = response.pipeThrough(new TextDecoderStream()).getReader()

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const promises = value
        .trim()
        .split("\n")
        .map(async (evt) => {
          try {
            const parsed = JSON.parse(evt)
            switch (parsed.event) {
              case "thread.message.delta":
                const delta = parsed.data.delta

                if (assistantContent.value === "...") {
                  assistantContent.value = ""
                }

                assistantContent.value += delta.content[0].text.value
                scrollMessages()
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
                await handleRunEvent(parsed)
            }
          } catch (e) {
            console.error("Error parsing event:", e)
          }
        })

      await Promise.all(promises)
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
    scrollMessages()
  } catch (err: any) {
    error.value = err.message || "Unknown error occurred"

    setTimeout(() => {
      error.value = null
    }, 3000)
  } finally {
    isLoading.value = false
  }
}

const projectStore = useProjectStore()

const project = ref(null)
const newMessage = ref("")
const activeModel = ref("assistant")
const models = ref([])

const { data: modelsData } = await useFetch("/api/models")
const { models: modelsValue } = modelsData.value
models.value = modelsValue

project.value = await projectStore.fetchProject(props.projectId)

const runs = ref([])
const runsContainer = ref(null)

const fetchRuns = async () => {
  const { data } = await useFetch(`/api/projects/${props.projectId}/runs`)
  const { runs: runsValue } = data.value
  runs.value = runsValue

  if (process.client) {
    scrollRuns()
  }
}

const handleRunEvent = async (evt) => {
  const index = runs.value.findIndex((run) => run.id == evt.data.id)

  if (index !== -1) {
    runs.value[index] = evt.data
  } else {
    runs.value = [...runs.value, evt.data]
    scrollRuns()
  }
}

const scrollRuns = () => {
  nextTick(() => {
    if (runsContainer.value) {
      runsContainer.value.scrollTop = runsContainer.value.scrollHeight
    }
  })
}

const runs = ref([])
const runsContainer = ref(null)

const fetchRuns = async () => {
  const { data } = await useFetch(`/api/projects/${props.projectId}/runs`)
  const { runs: runsValue } = data.value
  runs.value = runsValue

  if (process.client) {
    scrollRuns()
  }
}

const handleRunEvent = (evt) => {
  const index = runs.value.findIndex((run) => run.id == evt.data.id)

  if (index !== -1) {
    runs.value[index] = evt.data
  } else {
    runs.value = [...runs.value, evt.data]
    scrollRuns()
  }
}

const scrollRuns = () => {
  nextTick(() => {
    if (runsContainer.value) {
      runsContainer.value.scrollTop = runsContainer.value.scrollHeight
    }
  })
}

await fetchMessages(project.value.threadId)
await fetchRuns()

const humanDifference = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return formatDistanceToNow(date, { addSuffix: true })
}

const runningStatuses = ["queued", "in_progress", "requires_action"]

const runClass = (run) => {
  const type = {
    queued: "neutral",
    in_progress: "primary",
    requires_action: "warning",
    cancelling: "warning",
    cancelled: "error",
    failed: "error",
    completed: "success",
    incomplete: "warning",
    expired: "error",
  }[run.status]

  return `bg-${type} text-${type}-content`
}

const runIcon = (run) => {
  return {
    queued: "hi-clock",
    in_progress: "hi-refresh",
    requires_action: "hi-exclamation",
    cancelling: "hi-ban",
    cancelled: "hi-x-circle",
    failed: "hi-x",
    completed: "hi-check-circle",
    incomplete: "hi-minus-circle",
    expired: "fa-regular-hourglass",
  }[run.status]
}

const cancelRun = async (runId) => {
  await $fetch(`/api/projects/${props.projectId}/runs/${runId}/cancel`, {
    method: "POST",
  })
}

const handleSendMessage = async (evt) => {
  if (evt.shiftKey) return
  if (!newMessage.value) return
  evt.preventDefault()
  const content = newMessage.value + ""
  newMessage.value = ""

  await sendMessage(project.value, content, activeModel.value)
}

watch(
  activeModel,
  (value) => {
    nextTick(() => {
      if (value) {
        localStorage.setItem("activeModel", JSON.stringify(value))
      } else {
        localStorage.removeItem("activeModel")
      }
    })
  },
  { deep: true },
)

const newThread = async () => {
  const confirmed = confirm(
    "Are you sure you want to start a new thread? This will archive the current thread.",
  )

  if (!confirmed) return

  const { thread } = await $fetch(`/api/threads`, {
    method: "POST",
  })

  const attributes = project.value
  attributes.threadId = thread.id
  project.value = await projectStore.updateProject(props.projectId, attributes)

  await fetchMessages(thread.id)
  await fetchRuns()
}

onMounted(async () => {
  const modelValue = localStorage.getItem("activeModel")

  if (modelValue) {
    const model = JSON.parse(modelValue)
    activeModel.value = model
  }

  scrollMessages()
  scrollRuns()
})
</script>
<template>
  <div class="flex-1 flex flex-row">
    <div class="flex-1 flex flex-col bg-base-100 h-screen">
      <div class="navbar text-neutral z-10">
        <div class="navbar-start">
          <h2 class="font-bold text-xl pl-8">{{ project.name }}</h2>
          <ul class="menu menu-horizontal px-1">
            <li>
              <details ref="modelDetails">
                <summary>
                  {{ activeModel }}
                </summary>
                <ul class="bg-base-100 rounded-t-none min-w-60">
                  <li><h2 class="menu-title">Model</h2></li>
                  <li>
                    <a
                      :class="{
                        active: activeModel && activeModel === 'assistant',
                      }"
                      @click="
                        (activeModel = 'assistant'),
                          $refs.modelDetails.removeAttribute('open')
                      "
                    >
                      assistant
                    </a>
                  </li>
                  <li v-for="model in models" :key="model.id">
                    <a
                      :class="{ active: activeModel && activeModel === model }"
                      @click="
                        (activeModel = model),
                          $refs.modelDetails.removeAttribute('open')
                      "
                      >{{ model }}</a
                    >
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <button btn="btn btn-error" @click="newThread">New Thread</button>
            </li>
          </ul>
        </div>
      </div>
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4">
        <template v-for="message in messages" :key="message.id">
          <div v-if="message.role === 'assistant'" class="chat chat-start">
            <div class="chat-bubble bg-white text-black">
              <span
                v-if="message.content[0].text.value === '...'"
                class="loading loading-dots"
              />
              <span
                v-else
                v-html="renderMarkdown(message.content[0].text.value)"
              />
            </div>
          </div>
          <div v-else class="chat chat-end">
            <div class="chat-bubble bg-base-200 text-black">
              <span v-html="renderMarkdown(message.content[0].text.value)" />
            </div>
          </div>
        </template>
      </div>

      <div class="w-2/3 mx-auto">
        <div class="flex flex-row p-4 gap-2 w-full">
          <div class="flex-grow">
            <textarea
              v-model="newMessage"
              type="text"
              class="textarea bg-base-200 w-full"
              placeholder="Type your message here..."
              rows="1"
              @keyup.enter="handleSendMessage"
            />
          </div>
          <button class="btn-circle ml-2" @click="handleSendMessage">
            <v-icon
              scale="2"
              name="bi-arrow-up-circle-fill"
              class="text-base-300"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col h-screen px-4 py-6 w-1/3">
      <h1 class="font-bold text-xl pb-4">Runs</h1>
      <div
        class="flex-1 flex flex-col gap-2 overflow-y-auto"
        ref="runsContainer"
      >
        <div
          v-for="run in runs"
          :key="run.id"
          :class="'card card-compact rounded shadow ' + runClass(run)"
        >
          <div class="card-body">
            <div class="flex justify-between">
              <div class="tooltip" :data-tip="run.status">
                <v-icon :name="runIcon(run)" />
              </div>
              <span>created {{ humanDifference(run.created_at) }}</span>
              <button
                v-if="runningStatuses.includes(run.status)"
                @click="cancelRun(run.id)"
              >
                <v-icon name="md-cancel" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
