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

const statuses = [
  "queued",
  "in_progress",
  "requires_action",
  "cancelling",
  "cancelled",
  "failed",
  "completed",
  "incomplete",
  "expired",
]

// DaisyUI semantic classes for run status
const runClass = (run) => {
  return (
    "badge-" +
    {
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
  )
}
console.log(runClass({ status: "queued" }))
</script>
<template>
  <div class="px-4 py-6">
    <h1 class="font-bold text-xl pb-4">Runs</h1>
    <div class="flex flex-col gap-2">
      <div
        v-for="run in runs"
        :key="run.id"
        class="card card-compact rounded shadow bg-neutral-content text-neutral"
      >
        <div class="card-body">
          <div class="flex justify-between">
            {{ humanDifference(run.created_at) }}
            <div :class="'badge ' + runClass(run)">{{ run.status }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
