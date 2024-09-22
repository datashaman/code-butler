<script setup>
const props = defineProps({
  assistantId: {
    type: String,
    required: false,
  },
})

const model = ref("")
const name = ref("")
const description = ref("")
const instructions = ref("")

const models = ref([])

const { data: modelsData } = await useFetch("/api/models")
models.value = modelsData.value.models

if (props.assistantId) {
  const { data } = await useFetch(`/api/assistants/${props.assistantId}`)
  const { assistant } = data.value
  name.value = assistant.name
  description.value = assistant.description
  instructions.value = assistant.instructions
}

const createAssistant = async () => {
  const { assistant } = await $fetch("/api/assistants", {
    method: "POST",
    body: JSON.stringify({
      model: model.value,
      name: name.value,
      description: description.value,
      instructions: instructions.value,
    }),
  })

  return assistant
}

const updateAssistant = async () => {
  const { assistant } = await $fetch(`/api/assistants/${props.assistantId}`, {
    method: "PUT",
    body: JSON.stringify({
      model: model.value,
      name: name.value,
      description: description.value,
      instructions: instructions.value,
    }),
  })

  return assistant
}

const saveAssistant = async () => {
  if (props.assistantId) {
    await updateAssistant()
  } else {
    const assistant = await createAssistant()
    await navigateTo(`/assistants/${assistant.id}/edit`)
  }
}

const deleteAssistant = async () => {
  const response = await $fetch(`/api/assistants/${props.assistantId}`, {
    method: "DELETE",
  })

  await navigateTo("/assistants/create")
}
</script>
<template>
  <form @submit.prevent="saveAssistant">
    <div class="form-control w-full">
      <div class="label">
        <div class="label-text">Model</div>
      </div>
      <select class="select select-bordered w-full" v-model="model" required>
        <option value="">Select a Model</option>
        <option v-for="m in models" :value="m">
          {{ m }}
        </option>
      </select>
    </div>
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
        <button class="btn btn-error" @click.prevent="deleteAssistant">
          Delete
        </button>
        <button class="btn btn-primary" type="submit">Update</button>
      </template>
      <button v-else class="btn btn-primary" type="submit">Create</button>
    </div>
  </form>
</template>
