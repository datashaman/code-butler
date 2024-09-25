<script setup lang="ts">
import markdownit from "markdown-it"
import hljs from "highlight.js"
import DOMPurify from "isomorphic-dompurify"
import "highlight.js/styles/base16/solarized-light.css"

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
})

const renderMarkdown = (content) => {
  const md = markdownit({
    breaks: true,
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return (
            '<pre><code class="hljs">' +
            hljs.highlight(str, { language: lang, ignoreIllegals: true })
              .value +
            "</code></pre>"
          )
        } catch (e) {
          console.error(e)
        }
      }

      return (
        '<pre><code class="hljs">' + md.utils.escapeHtml(str) + "</code></pre>"
      )
    },
    html: true,
    linkify: true,
    typographer: true,
  })
  const html = md.render(content)
  return DOMPurify.sanitize(html)
}

const messages = ref<{ role: string; content: string }[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeRunId = ref(null)
const runRefs = ref<{ [key: string]: HTMLElement | null }>({})

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

const sendMessage = async (project, model: string, content: string = "") => {
  isLoading.value = true
  error.value = null

  if (content) {
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
  }

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
    const body = content
      ? {
          additional_messages: [
            {
              role: "user",
              content,
            },
          ],
        }
      : {
          additional_instructions:
            "List files in the root folder to detect facts about the project. Once you have a list of facts, confirm if they should be added to the project.",
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
        .map(async (source) => {
          try {
            const evt = JSON.parse(source)
            // console.log("Received event:", evt)

            switch (evt.data.object) {
              case "thread.message.delta":
                handleMessageDeltaEvent(evt, assistantContent)
                break
              case "thread.run":
                handleRunEvent(evt)
                break
              case "thread.run.step":
                handleRunStepEvent(evt)
                break
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

if (typeof project.value.facts === "string") {
  if (project.value.facts === "") {
    project.value.facts = []
  } else {
    project.value.facts = JSON.parse(project.value.facts)
  }
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

const handleMessageDeltaEvent = (evt, assistantContent) => {
  // console.debug("Received message delta event", evt)
  const delta = evt.data.delta

  if (assistantContent.value === "...") {
    assistantContent.value = ""
  }

  assistantContent.value += delta.content[0].text.value
  scrollMessages()
}

const handleRunEvent = async (evt) => {
  // console.debug("Received run event", evt)
  const index = runs.value.findIndex((run) => run.id == evt.data.id)

  if (index !== -1) {
    runs.value[index] = evt.data
  } else {
    runs.value = [...runs.value, evt.data]
    scrollRuns()
  }
}

const handleRunStepEvent = async (evt) => {
  // console.debug("Received run step event", evt)
  const step = evt.data
  const runRef = runRefs[step.run_id]
  if (!runRef) {
    console.error("Run ref not found", step.run_id)
    return
  }
  runRef.handleRunStepEvent(evt)
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

const handleSendMessage = async (content) => {
  await sendMessage(project.value, activeModel.value, content)
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

const setActiveRunId = async (runId) => {
  activeRunId.value = runId
}

onMounted(async () => {
  const modelValue = localStorage.getItem("activeModel")

  if (modelValue) {
    const model = JSON.parse(modelValue)
    activeModel.value = model
  }

  if (messages.value.length === 0) {
    await sendMessage(project.value, activeModel.value)
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
          <h2 class="font-bold text-xl pl-4">{{ project.name }}</h2>
          <ul class="menu menu-xs menu-horizontal px-1 py-0">
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
      <div ref="messagesContainer" class="flex-1 overflow-y-auto pr-4">
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

      <div class="w-full xl:w-2/3 mx-auto">
        <ChatInput
          :projectId="props.projectId"
          @message-sent="handleSendMessage"
        />
      </div>
    </div>

    <div class="flex flex-col h-screen w-1/3 pr-6 pb-4">
      <div class="navbar">
        <div class="navbar-start">
          <h2 class="font-bold text-xl pb-4 pt-3">Runs</h2>
        </div>
      </div>
      <div
        class="flex-1 flex flex-col gap-2 px-2 overflow-y-auto"
        ref="runsContainer"
      >
        <Run
          v-for="run in runs"
          :projectId="projectId"
          ref="runRefs[run.id]"
          :run="run"
          :active="activeRunId === run.id"
          :key="run.id"
          @active-run-set="setActiveRunId"
        />
      </div>
    </div>
  </div>
</template>
