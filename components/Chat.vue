<script setup lang="ts">
import { marked } from "marked"
import markedLinkifyIt from "marked-linkify-it"
import DOMPurify from "isomorphic-dompurify"

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
})

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
  scrollToBottom,
} = useChat()

const project = ref(null)
const newMessage = ref("")
const activeModel = ref(null)
const models = ref([])

const { data: modelsData } = await useFetch("/api/models")
const { models: modelsValue } = modelsData.value
models.value = modelsValue

const { data: projectData } = await useFetch(`/api/projects/${props.projectId}`)
const { project: projectValue } = projectData.value
project.value = projectValue

await fetchMessages(project.value.threadId)

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
})
</script>
<template>
  <div class="flex-1 flex flex-col bg-base-100 h-screen">
    <div class="navbar text-neutral z-10">
      <div class="navbar-start">
        <h2 class="font-bold text-xl pl-8">{{ project.name }}</h2>
        <ul class="menu menu-horizontal px-1">
          <li>
            <details ref="modelDetails">
              <summary>
                <span v-if="activeModel">{{ activeModel }}</span>
                <span v-else>Model</span>
              </summary>
              <ul class="bg-base-100 rounded-t-none min-w-60">
                <li><h2 class="menu-title">Model</h2></li>
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
</template>
