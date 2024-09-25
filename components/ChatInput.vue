<script setup>
const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(["message-sent"])

const newMessage = ref("")

const sendMessage = (evt) => {
  if (evt.shiftKey) return
  if (!newMessage.value) return
  evt.preventDefault()
  emit("message-sent", newMessage.value)
  newMessage.value = ""
}

const handleAudio = async (audio) => {
  const formData = new FormData()
  formData.append("file", audio)

  const { transcription } = await $fetch(
    `/api/projects/${props.projectId}/transcriptions`,
    {
      method: "POST",
      body: formData,
    },
  )

  emit("message-sent", transcription)
}
</script>
<template>
  <div class="flex flex-row p-4 gap-0 w-full">
    <div class="flex-grow">
      <textarea
        v-model="newMessage"
        type="text"
        class="textarea bg-base-200 w-full"
        placeholder="Type your message here..."
        rows="1"
        @keyup.enter="sendMessage"
      />
    </div>
    <button class="btn-circle ml-2" @click="sendMessage">
      <v-icon scale="2" name="bi-arrow-up-circle-fill" class="text-base-300" />
    </button>
    <ClientOnly>
      <AudioRecorder @audio-recorded="handleAudio" />
    </ClientOnly>
  </div>
</template>
