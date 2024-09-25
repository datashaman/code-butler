<script setup>
import { ref, watch } from "vue"
import { formatDistanceToNow } from "date-fns"

const props = defineProps({
  projectId: String,
  run: Object,
  active: Boolean,
})

const emit = defineEmits(["activeRunSet"])

defineExpose({
  handleRunStepEvent: async (evt) => {
    console.log("handling run step event", evt)
  },
})

const runningStatuses = ["queued", "in_progress", "requires_action"]
const steps = ref([])

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

const runStepClass = (step) => {
  const type = {
    in_progress: "primary",
    cancelled: "error",
    failed: "error",
    completed: "success",
    expired: "error",
  }[step.status]

  return `text-${type}`
}

const runIcon = (run) => {
  return {
    queued: "hi-clock",
    requires_action: "hi-exclamation",
    cancelling: "hi-ban",
    cancelled: "hi-x-circle",
    failed: "hi-x",
    completed: "hi-check-circle",
    incomplete: "hi-minus-circle",
    expired: "fa-regular-hourglass",
  }[run.status]
}

const runStepIcon = (step) => {
  return {
    cancelled: "hi-x-circle",
    failed: "hi-x",
    completed: "hi-check-circle",
    expired: "fa-regular-hourglass",
  }[step.status]
}

const cancelRun = async (runId) => {
  await $fetch(`/api/projects/${props.projectId}/runs/${props.run.id}/cancel`, {
    method: "POST",
  })
}

const fetchSteps = async () => {
  const { data } = await useFetch(
    `/api/projects/${props.projectId}/runs/${props.run.id}/steps`,
  )
  const { steps: fetchedSteps } = data.value
  steps.value = fetchedSteps
}

const toolCallArguments = (toolCall) => {
  const args = JSON.parse(toolCall.function.arguments)
  const values = Object.keys(args).map((key) => {
    const value = args[key]

    if (toolCall.function.name === "saveFile" && key === "contents") {
      return JSON.stringify("...")
    }

    return JSON.stringify(value)
  })

  return values.join(", ")
}

watch(
  () => props.active,
  async () => {
    await fetchSteps()
  },
)

await fetchSteps()
</script>
<template>
  <div class="join join-vertical shadow-sm border">
    <div
      :class="'join-item cursor-pointer p-2 rounded-lg ' + runClass(run)"
      @click="$emit('activeRunSet', run.id)"
    >
      <div class="flex justify-between">
        <div class="tooltip" :data-tip="run.status">
          <span
            v-if="run.status === 'in_progress'"
            class="loading loading-sm loading-spinner"
          />
          <v-icon v-else :name="runIcon(run)" />
        </div>
        <span v-if="run.status === 'completed'">
          completed {{ humanDifference(run.completed_at) }}
        </span>
        <span v-if="run.status === 'failed'">
          failed {{ humanDifference(run.failed_at) }}
        </span>
        <span v-if="run.status === 'expired'">
          expired {{ humanDifference(run.completed_at) }}
        </span>
        <span v-if="run.status === 'cancelled'">
          cancelled {{ humanDifference(run.cancelled_at) }}
        </span>
        <button
          v-if="runningStatuses.includes(run.status)"
          @click="cancelRun(run.id)"
        >
          <v-icon name="md-cancel" />
        </button>
      </div>
    </div>
    <div
      v-if="active || runningStatuses.includes(run.status)"
      class="join-item p-2 flex flex-col gap-2"
    >
      <div v-for="step in steps" :key="step.id">
        <div :class="'flex justify-between ' + runStepClass(step)">
          <span
            v-if="step.status === 'in_progress'"
            class="loading loading-sm loading-spinner"
          />
          <v-icon v-else :name="runStepIcon(step)" />
          <span v-if="run.status === 'completed'">
            completed {{ humanDifference(run.completed_at) }}
          </span>
          <span v-if="run.status === 'failed'">
            failed {{ humanDifference(run.failed_at) }}
          </span>
          <span v-if="run.status === 'expired'">
            expired {{ humanDifference(run.completed_at) }}
          </span>
          <span v-if="run.status === 'cancelled'">
            cancelled {{ humanDifference(run.cancelled_at) }}
          </span>
        </div>
        <div>
          <div v-if="step.type === 'tool_calls'">
            <ul>
              <li
                v-for="toolCall in step.step_details.tool_calls"
                :key="toolCall.id"
              >
                {{ toolCall.function.name }}({{ toolCallArguments(toolCall) }})
              </li>
            </ul>
          </div>
          <div v-else-if="step.type === 'message_creation'">create message</div>
          <div v-else>
            {{ step.type }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
