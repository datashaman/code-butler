<script setup>
const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(["sidebar-state"])

const assistantStore = useAssistantStore()
const projectStore = useProjectStore()

await assistantStore.fetchAssistants()
await projectStore.fetchProjects()
</script>
<template>
  <div class="h-full">
    <div v-if="open" class="bg-base-200 h-full pt-2">
      <ul class="menu">
        <li>
          <div class="flex flex-row">
            <nuxt-link to="/assistants/create">
              <v-icon name="bi-plus-square" />
            </nuxt-link>
            <h2 class="flex-1">Assistants</h2>
            <button @click.prevent="emit('sidebar-state', false)">
              <v-icon name="oi-sidebar-expand" />
            </button>
          </div>
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
          <div class="flex flex-row">
            <nuxt-link to="/projects/create">
              <v-icon name="bi-plus-square" />
            </nuxt-link>
            <h2 class="flex-1">Projects</h2>
          </div>
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
    <div v-else class="py-5 p-2">
      <button @click="emit('sidebar-state', true)">
        <v-icon name="oi-sidebar-expand" />
      </button>
    </div>
  </div>
</template>
<style scoped>
h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--fallback-bc, oklch(var(--bc) / 0.4));
  line-height: 1.25rem;
}
</style>
