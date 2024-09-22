<script setup>
const props = defineProps({
  projectId: {
    type: String,
    required: false,
  },
})

const snackbar = useSnackbar()

const assistantStore = useAssistantStore()
const projectStore = useProjectStore()

const name = ref("")
const path = ref("")
const assistantId = ref("")
const description = ref("")

await assistantStore.fetchAssistants()

if (props.projectId) {
  const project = await projectStore.fetchProject(props.projectId)

  name.value = project.name
  path.value = project.path
  assistantId.value = project.assistantId
  description.value = project.description
}

const makeProject = () => ({
  name: name.value,
  path: path.value,
  assistantId: assistantId.value,
  description: description.value,
})

const createProject = async () => {
  const project = projectStore.createProject(makeProject())

  snackbar.add({
    text: "Project created successfully",
    type: "success",
  })

  return project
}

const updateProject = async () => {
  const project = projectStore.updateProject(props.projectId, makeProject())

  snackbar.add({
    text: "Project updated successfully",
    type: "success",
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
  const confirmed = confirm("Are you sure you want to delete this project?")
  if (!confirmed) return
  await projectStore.deleteProject(props.projectId)

  snackbar.add({
    text: "Project deleted successfully",
    type: "success",
  })

  await navigateTo("/projects/create")
}
</script>
<template>
  <div class="w-full lg:w-1/3">
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
          <option
            v-for="assistant in assistantStore.assistants"
            :value="assistant.id"
          >
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
          <button class="btn btn-error" @click.prevent="deleteProject">
            Delete
          </button>
          <button class="btn btn-primary" type="submit">Update</button>
        </template>
        <button v-else class="btn btn-primary" type="submit">Create</button>
      </div>
    </form>
  </div>
</template>
