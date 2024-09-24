<script setup>
const isRecording = ref(false)
const mediaRecorder = ref(null)
const audioChunks = ref([])
const emit = defineEmits(["audio-recorded"])

const hasMediaRecorder = "MediaRecorder" in window
const hasGetUserMedia =
  "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices

if (!hasMediaRecorder || !hasGetUserMedia) {
  alert("Your browser does not support audio recording.")
}

const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder.value = new MediaRecorder(stream)
      mediaRecorder.value.addEventListener("dataavailable", onDataAvailable)
      mediaRecorder.value.addEventListener("stop", onStop)
      mediaRecorder.value.start()
      isRecording.value = true
    })
    .catch((error) => {
      isRecording.value = false
      if (error.name === "NotAllowedError") {
        alert(
          "Microphone access was denied. Please allow access to use this feature.",
        )
      } else if (error.name === "NotFoundError") {
        alert(
          "No microphone was found. Please connect a microphone and try again.",
        )
      } else {
        alert(
          `An error occurred while accessing the microphone: ${error.message}`,
        )
      }
      console.error("Error accessing microphone:", error)
    })
}

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === "recording") {
    mediaRecorder.value.stop()
    isRecording.value = false
  }
}

const onDataAvailable = (event) => {
  audioChunks.value.push(event.data)
}

const onStop = () => {
  const audioBlob = new Blob(audioChunks.value, {
    type: "audio/webm; codecs=opus",
  })
  audioChunks.value = []
  // Stop all media tracks
  mediaRecorder.value.stream.getTracks().forEach((track) => track.stop())
  emit("audio-recorded", audioBlob)
}
</script>
<template>
  <button @click.prevent="toggleRecording" class="btn-circle">
    <v-icon v-if="isRecording" scale="2" name="bi-circle-fill" />
    <v-icon v-else name="io-mic-circle" scale="2" class="text-base-300" />
  </button>
</template>
