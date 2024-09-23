<script setup>
const props = defineProps({
  projectId: String,
})

const { data } = await useFetch(`/api/projects/${props.projectId}/actions`)
const actions = ref(data.value.actions)
</script>
<template>
  <div class="px-4 py-6">
    <h1 class="font-bold text-xl pb-4">Actions</h1>
    <ul>
      <li v-for="action in actions" :key="action.id">
        <div class="badge badge-neutral">{{ action.tool }}</div>
        <div>{{ action.args }}</div>
      </li>
    </ul>
  </div>
</template>
