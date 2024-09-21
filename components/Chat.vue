<script setup lang="ts">
const {
  messagesContainer,
  messages,
  sendMessage,

  fetchMessages,
  scrollToBottom,
} = useChat()

const newMessage = ref("")
const sidebarOpen = ref(false)

const handleSendMessage = async () => {
  if (!newMessage.value) return

  await sendMessage(newMessage.value)
  newMessage.value = ""
  scrollToBottom()
}

onMounted(async () => {
  await fetchMessages()
})
</script>
<template>
  <div class="flex flex-row">
    <div v-if="sidebarOpen" class="flex-none w-80 py-2 bg-base-200">
      <ul class="menu">
        <li><a>New Project</a></li>
        <li><h2 class="menu-title">Projects</h2></li>
        <li><a class="active">Project 1</a></li>
        <li><a class="">Project 2</a></li>
      </ul>
      <ul class="menu">
        <li><a>Settings</a></li>
      </ul>
    </div>
    <div class="flex-1 flex flex-col bg-base-100 h-screen">
      <div class="navbar text-neutral z-10">
        <div class="navbar-start">
          <ul class="menu menu-horizontal px-1">
            <button v-if="sidebarOpen" @click="sidebarOpen = false">
              <v-icon name="oi-sidebar-expand" />
            </button>
            <button v-else @click="sidebarOpen = true">
              <v-icon name="oi-sidebar-collapse" />
            </button>
            <li>
              <details>
                <summary>gpt-4o</summary>
                <ul class="bg-base-100 rounded-t-none min-w-40">
                  <li><h2 class="menu-title">Model</h2></li>
                  <li><a class="active">gpt-4o</a></li>
                  <li><a>o1-preview</a></li>
                  <li><a>o1-mini</a></li>
                </ul>
              </details>
            </li>
          </ul>
          <ul class="menu menu-horizontal px-1">
            <li>
              <details>
                <summary>Edit</summary>
                <ul class="bg-base-100 rounded-t-none min-w-40">
                  <li><a>Undo</a></li>
                  <li><a>Redo</a></li>
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
              <span v-else>
                {{ message.content[0].text.value }}
              </span>
            </div>
          </div>
          <div v-else class="chat chat-end">
            <div class="chat-bubble bg-base-200 text-black">
              {{ message.content[0].text.value }}
            </div>
          </div>
        </template>
      </div>

      <div class="w-1/2 mx-auto">
        <div class="flex flex-row p-4 gap-2 w-full">
          <div class="flex-grow">
            <textarea
              v-model="newMessage"
              type="text"
              class="textarea bg-base-200 w-full"
              placeholder="Type your message here..."
              @keyup.enter="handleSendMessage"
            />
          </div>
          <button class="ml-2 btn" @click="handleSendMessage">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>
