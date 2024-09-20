<script setup lang="ts">
const {
  messagesContainer,
  messages,
  sendMessage,

  fetchMessages,
  scrollToBottom,
} = useChat()

const newMessage = ref("")

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
  <div class="h-screen">
    <div
      ref="messagesContainer"
      class="flex-grow overflow-y-auto p-2 bg-secondary-content"
    >
      <template v-for="message in messages" :key="message.id">
        <div v-if="message.role === 'assistant'" class="chat chat-start">
          <div class="chat-bubble chat-bubble-secondary">
            {{ message.content[0].text.value }}
          </div>
        </div>
        <div v-else class="chat chat-end">
          <div class="chat-bubble chat-bubble-primary">
            {{ message.content[0].text.value }}
          </div>
        </div>
      </template>
    </div>

    <div class="w-full bg-base-300">
      <div class="flex p-2 gap-2 w-full">
        <div class="flex-grow">
          <input
            v-model="newMessage"
            type="text"
            class="input input-bordered input-sm w-full"
            placeholder="Type your message here..."
            @keyup.enter="handleSendMessage"
          />
        </div>
        <button class="ml-2 btn btn-primary btn-sm" @click="handleSendMessage">
          Send
        </button>
      </div>
    </div>
  </div>
</template>
