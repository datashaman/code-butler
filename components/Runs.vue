<script setup>
const props = defineProps({
  projectId: String,
})

const { fetchRuns, scrollRuns, runsContainer, runs } = useRunStore()
await fetchRuns(props.projectId)

const humanDifference = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return formatDistanceToNow(date, { addSuffix: true })
}

const cancellableStatuses = ["queued", "in_progress", "requires_action"]

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

const cancelRun = async (runId) => {
  await $fetch(`/api/projects/${props.projectId}/runs/${runId}/cancel`, {
    method: "POST",
  })
}

onMounted(() => {
  scrollRuns()
})
</script>
<template></template>
