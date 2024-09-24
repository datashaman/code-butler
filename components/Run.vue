<script setup>
import { formatDistanceToNow } from "date-fns"

const props = defineProps({
  projectId: String,
  run: Object,
})

const emit = defineEmits(["active-run-set"])

const runningStatuses = ["queued", "in_progress", "requires_action"]

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

const runIcon = (run) => {
  return {
    queued: "hi-clock",
    in_progress: "hi-refresh",
    requires_action: "hi-exclamation",
    cancelling: "hi-ban",
    cancelled: "hi-x-circle",
    failed: "hi-x",
    completed: "hi-check-circle",
    incomplete: "hi-minus-circle",
    expired: "fa-regular-hourglass",
  }[run.status]
}

const cancelRun = async (runId) => {
  await $fetch(`/api/projects/${props.projectId}/runs/${props.run.id}/cancel`, {
    method: "POST",
  })
}
</script>
<template>
  <div :class="'p-2 rounded shadow ' + runClass(run)">
    <div class="flex justify-between" @click="$emit('active-run-set', run)">
      <div class="tooltip" :data-tip="run.status">
        <v-icon :name="runIcon(run)" />
      </div>
      <span>created {{ humanDifference(run.created_at) }}</span>
      <button
        v-if="runningStatuses.includes(run.status)"
        @click="cancelRun(run.id)"
      >
        <v-icon name="md-cancel" />
      </button>
    </div>
  </div>
</template>
