<script setup>
const assistantStore = useAssistantStore()
const projectStore = useProjectStore()

const open = ref(false)

watch(
  open,
  (value) => {
    localStorage.setItem("sidebarOpen", JSON.stringify(value))
  },
  { deep: true },
)

onMounted(async () => {
  const openValue = localStorage.getItem("sidebarOpen")

  if (openValue !== null) {
    open.value = JSON.parse(openValue)
  }

  await assistantStore.fetchAssistants()
  await projectStore.fetchProjects()
})
</script>
<template>
  <div v-if="open" class="bg-base-200 h-full">
    <ul class="menu">
      <li>
        <nuxt-link to="/assistants/create">
          <v-icon name="bi-plus-square" />
          <h2>Assistants</h2>
        </nuxt-link>
      </li>
      <li v-for="assistant in assistantStore.assistants" :key="assistant.id">
        <nuxt-link :to="`/assistants/${assistant.id}/edit`">
          <v-icon name="bi-pencil-square" />
          {{ assistant.name }}
        </nuxt-link>
      </li>
    </ul>

    <ul class="menu">
      <li>
        <nuxt-link to="/projects/create">
          <v-icon name="bi-plus-square" />
          <h2>Projects</h2>
        </nuxt-link>
      </li>
      <li v-for="project in projectStore.projects" :key="project.id">
        <nuxt-link :to="`/projects/${project.id}`">
          <nuxt-link :to="`/projects/${project.id}/edit`">
            <v-icon name="bi-pencil-square" />
          </nuxt-link>
          {{ project.name }}
        </nuxt-link>
      </li>
    </ul>
  </div>
</template>
<style scoped>
h2 {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fallback-bc, oklch(var(--bc) / 0.4));
  line-height: 1.25rem;
}
</style>
