<script setup>
const props = defineProps({
  assistantId: {
    type: String,
    required: false,
  },
})

const name = ref("")
const description = ref("")
const instructions = ref("")

if (props.assistantId) {
  const { data } = await useFetch(`/api/assistants/${props.assistantId}`)
  const { assistant } = data.value
  name.value = assistant.name
  description.value = assistant.description
  instructions.value = assistant.instructions
}

const createAssistant = async () => {
  const response = await $fetch("/api/assistants", {
    mestthod: "POST",
    body: JSON.stringify({
      name: name.value,
      description: description.value,
      instructions: instructions.value,
    }),
  })
}

const updateAssistant = async () => {
  const response = await $fetch(`/api/assistants/${props.assistantId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: name.value,
      description: description.value,
      instructions: instructions.value,
    }),
  })
}

const deleteAssistant = async () => {
  const response = await $fetch(`/api/assistants/${props.assistantId}`, {
    method: "DELETE",
  })
}
</script>
<template>
  <form>
    <div class="form-control w-full">
      <div class="label">
        <div class="label-text">Name</div>
      </div>
      <input
        type="text"
        class="input input-bordered"
        placeholder="Assistant Name"
        v-model="name"
        required
      />
    </div>
    <div class="form-control w-full">
      <div class="label">
        <div class="label-text">Instructions</div>
      </div>
      <textarea
        class="textarea textarea-bordered textarea-sm w-full"
        placeholder="Assistant Instructions"
        v-model="instructions"
        required
      />
    </div>
    <div class="form-control w-full">
      <div class="label">
        <div class="label-text">Description</div>
      </div>
      <textarea
        class="textarea textarea-bordered textarea-sm w-full"
        placeholder="Assistant Description"
        v-model="description"
      />
    </div>
    <div class="mt-4 flex justify-between">
      <template v-if="props.assistantId">
        <button class="btn btn-error" @click="deleteAssistant">Delete</button>
        <button class="btn btn-primary" @click="updateAssistant">Update</button>
      </template>
      <button v-else class="btn btn-primary" @click="createAssistant">
        Create
      </button>
    </div>
  </form>
</template>
