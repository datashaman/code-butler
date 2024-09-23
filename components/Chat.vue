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

const {
  messagesContainer,
  messages,
  sendMessage,

  fetchMessages,
  scrollMessages,
} = useChat()

const project = ref(null)
const newMessage = ref("")
const activeModel = ref("assistant")
const models = ref([])

const { data: modelsData } = await useFetch("/api/models")
const { models: modelsValue } = modelsData.value
models.value = modelsValue

const { data: projectData } = await useFetch(`/api/projects/${props.projectId}`)
const { project: projectValue } = projectData.value
project.value = projectValue

const { fetchRuns, scrollRuns, runsContainer, runs } = useRunStore()

await fetchMessages(project.value.threadId)
await fetchRuns(props.projectId)

const humanDifference = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return formatDistanceToNow(date, { addSuffix: true })
}

const cancellableStatuses = ["queued", "in_progress", "requires_action"]

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
    <div class="flex flex-col bg-base-100 h-screen">
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

    <div class="flex flex-col h-screen px-4 py-6 overflow-hidden w-1/5">
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
              <span>{{ run.status }}</span>
              <span>created {{ humanDifference(run.created_at) }}</span>
              <button
                v-if="cancellableStatuses.includes(run.status)"
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
