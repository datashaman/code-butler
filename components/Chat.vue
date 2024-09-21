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
  <div class="flex flex-col bg-neutral-content h-screen">
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4">
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

    <div class="w-full bg-base-200">
      <div class="flex flex-row p-4 gap-2 w-full">
        <div class="flex-grow">
          <textarea
            v-model="newMessage"
            type="text"
            class="textarea textarea-bordered w-full"
            placeholder="Type your message here..."
            @keyup.enter="handleSendMessage"
          />
        </div>
        <button class="ml-2 btn btn-primary" @click="handleSendMessage">
          Send
        </button>
      </div>
    </div>
  </div>
</template>
