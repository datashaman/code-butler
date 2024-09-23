<script setup>
import { formatDistanceToNow } from "date-fns"

const props = defineProps({
  projectId: String,
})

const { data } = await useFetch(`/api/projects/${props.projectId}/runs`)
const runs = ref(data.value.runs)

const humanDifference = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return formatDistanceToNow(date, { addSuffix: true })
}

const runClass = (run) => {
  const type = {
    queued: "neutral",
    in_progress: "primary",
    requires_action: "warning",
    cancelling: "warning",
    cancelled: "error",
    failed: "error",
    completed: "success",
    incomplete: "warning",
    expired: "error",
  }[run.status]

  return `bg-${type} text-${type}-content`
}
</script>
<template>
  <div class="px-4 py-6">
    <h1 class="font-bold text-xl pb-4">Runs</h1>
    <div class="flex flex-col gap-2">
      <div
        v-for="run in runs"
        :key="run.id"
        :class="'card card-compact rounded shadow ' + runClass(run)"
      >
        <div class="card-body">
          <div class="flex justify-between">
            created {{ humanDifference(run.created_at) }}
          </div>

          <div class="card-actions">
            {{ run.status }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
