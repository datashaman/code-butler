<script setup>
const props = defineProps({
  projectId: {
    type: String,
    required: false,
  },
})

const assistants = ref([])

const name = ref("")
const path = ref("")
const assistantId = ref("")
const description = ref("")

const { data } = await useFetch("/api/assistants")
const { assistants: assistantsData } = data.value
assistants.value = assistantsData

if (props.projectId) {
  const { data } = await useFetch(`/api/projects/${props.projectId}`)
  const { project } = data.value
  name.value = project.name
  path.value = project.path
  assistantId.value = project.assistantId
  description.value = project.description
}

const createProject = async () => {
  const { project } = await $fetch("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      name: name.value,
      path: path.value,
      assistantId: assistantId.value,
      description: description.value,
    }),
  })

  return project
}

const updateProject = async () => {
  const { project } = await $fetch(`/api/projects/${props.projectId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: name.value,
      path: path.value,
      assistantId: assistantId.value,
      description: description.value,
    }),
  })

  return project
}

const saveProject = async () => {
  if (props.projectId) {
    await updateProject()
  } else {
    const project = await createProject()
    await navigateTo(`/projects/${project.id}`)
  }
}

const deleteProject = async () => {
  const response = await $fetch(`/api/projects/${props.projectId}`, {
    method: "DELETE",
  })

  await navigateTo("/projects/create")
}
</script>
<template>
  <div>
    <form @submit.prevent="saveProject">
      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Name</div>
        </div>
        <input type="text" class="input input-bordered" v-model="name" />
      </div>

      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Path</div>
        </div>
        <input type="text" class="input input-bordered" v-model="path" />
      </div>

      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Assistant</div>
        </div>
        <select class="select select-bordered" v-model="assistantId">
          <option value="">Select an assistant</option>
          <option v-for="assistant in assistants" :value="assistant.id">
            {{ assistant.name }}
          </option>
        </select>
      </div>

      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Description</div>
        </div>
        <textarea class="textarea textarea-bordered" v-model="description" />
      </div>

      <div class="pt-4 w-full flex justify-between">
        <template v-if="props.projectId">
          <button class="btn btn-error" @click="deleteProject">Delete</button>
          <button class="btn btn-primary" type="submit">Update</button>
        </template>
        <button v-else class="btn btn-primary" type="submit">Create</button>
      </div>
    </form>
  </div>
</template>
