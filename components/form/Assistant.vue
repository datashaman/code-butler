<script setup>
const props = defineProps({
  assistantId: {
    type: String,
    required: false,
  },
})

const snackbar = useSnackbar()

const assistantStore = useAssistantStore()

// TODO make this dynamic
const availableTools = [
  "getCurrentTime",
  "saveFile",
  "listFiles",
  "moveFile",
  "removeFile",
  "getFileContents",
  "commitChanges",
  "undoChanges",
  "getProjectFacts",
  "addProjectFact",
  "removeProjectFact",
]

const model = ref("")
const name = ref("")
const description = ref("")
const instructions = ref("")
const temperature = ref(1)
const tools = ref(availableTools)

const errors = ref({})

const models = ref([])

const { data: modelsData } = await useFetch("/api/models")
models.value = modelsData.value.models

if (props.assistantId) {
  const assistant = await assistantStore.fetchAssistant(props.assistantId)
  model.value = assistant.model
  name.value = assistant.name
  description.value = assistant.description
  instructions.value = assistant.instructions
  temperature.value = assistant.temperature
  tools.value = assistant.tools.map((tool) => tool.function.name)
}

const makeAssistant = () => ({
  model: model.value,
  name: name.value,
  description: description.value,
  instructions: instructions.value,
  temperature: temperature.value,
  tools: tools.value,
})

const handleValidationError = (e) => {
  const { response } = e
  if (response.status === 400) {
    const issues = response._data.data.issues
    errors.value = issues.reduce((acc, issue) => {
      const attribute = issue.path.join(".") // Converts path array to a string (e.g., 'description')
      acc[attribute] = issue.message
      return acc
    }, {})

    return true
  }

  return false
}

const createAssistant = async () => {
  const assistant = assistantStore.createAssistant(makeAssistant())

  snackbar.add({
    text: "Assistant created successfully",
    type: "success",
  })

  return assistant
}

const updateAssistant = async () => {
  const assistant = await assistantStore.updateAssistant(
    props.assistantId,
    makeAssistant(),
  )

  snackbar.add({
    text: "Assistant updated successfully",
    type: "success",
  })

  return assistant
}

const saveAssistant = async () => {
  errors.value = {}

  try {
    if (props.assistantId) {
      await updateAssistant()
    } else {
      const assistant = await createAssistant()
      await navigateTo(`/assistants/${assistant.id}/edit`)
    }
  } catch (e) {
    if (!handleValidationError(e)) {
      throw e
    }
  }
}

const deleteAssistant = async () => {
  const confirmed = confirm("Are you sure you want to delete this assistant?")
  if (!confirmed) return
  await assistantStore.deleteAssistant(props.assistantId)

  snackbar.add({
    text: "Assistant deleted successfully",
    type: "success",
  })

  await navigateTo("/assistants/create")
}
</script>
<template>
  <div class="w-full lg:w-1/3">
    <form @submit.prevent="saveAssistant">
      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Model</div>
        </div>
        <select class="select select-bordered w-full" v-model="model">
          <option value="">Select a Model</option>
          <option v-for="m in models" :value="m">
            {{ m }}
          </option>
        </select>
        <div v-if="errors.model" class="label">
          <div class="label-text-alt text-error">{{ errors.model }}</div>
        </div>
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
        />
        <div v-if="errors.name" class="label">
          <div class="label-text-alt text-error">{{ errors.name }}</div>
        </div>
      </div>
      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Instructions</div>
        </div>
        <textarea
          class="textarea textarea-bordered w-full"
          placeholder="Assistant Instructions"
          v-model="instructions"
        />
        <div v-if="errors.instructions" class="label">
          <div class="label-text-alt text-error">{{ errors.instructions }}</div>
        </div>
      </div>
      <div class="form-control w-full">
        <div class="label">
          <span class="label-text">Temperature</span>
          <span class="label-text-alt">{{ temperature }}</span>
        </div>
        <input
          type="range"
          class="range"
          min="0"
          max="2"
          step="0.1"
          v-model="temperature"
        />
        <div v-if="errors.temperature" class="label">
          <div class="label-text-alt text-error">{{ errors.temperature }}</div>
        </div>
      </div>
      <div class="form-control">
        <div class="label">
          <span class="label-text">Tools</span>
        </div>
        <select class="select select-bordered w-full" multiple v-model="tools">
          <option v-for="tool in availableTools" :value="tool" :key="tool">
            {{ tool }}
          </option>
        </select>
      </div>
      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Description</div>
        </div>
        <textarea
          class="textarea textarea-bordered w-full"
          placeholder="Assistant Description"
          v-model="description"
        />
        <div v-if="errors.description" class="label">
          <div class="label-text-alt text-error">{{ errors.description }}</div>
        </div>
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
  </div>
</template>
