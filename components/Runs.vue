<script setup>
import { formatDistanceToNow } from "date-fns"

const props = defineProps({
  projectId: String,
})

const { fetchRuns, scrollToBottom, runsContainer, runs } = useRunStore()
await fetchRuns(props.projectId)

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

onMounted(() => {
  scrollToBottom()
})
</script>
<template>
  <div class="flex flex-col px-4 py-6">
    <h1 class="font-bold text-xl pb-4">Runs</h1>
    <div class="flex-1 flex flex-col gap-2 overflow-y-auto" ref="runsContainer">
      <div
        v-for="run in runs"
        :key="run.id"
        :class="'card card-compact rounded shadow ' + runClass(run)"
      >
        <div class="card-body">
          <div class="flex justify-between">
            <span>{{ run.status }}</span>
            <span>created {{ humanDifference(run.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
