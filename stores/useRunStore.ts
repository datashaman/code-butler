export const useRunStore = defineStore("runs", () => {
  const runs = ref([])
  const runsContainer = ref(null)

  const fetchRuns = async (projectId) => {
    const { data } = await useFetch(`/api/projects/${projectId}/runs`)
    runs.value = data.value.runs
    scrollToBottom()
  }

  const handleEvent = (evt) => {
    console.log(evt)
    const index = runs.value.findIndex((run) => run.id == evt.data.id)

    if ($index !== -1) {
      runs.value[index] = evt.data
    } else {
      runs.value = [evt.data, ...runs.value]
    }
  }

  const scrollToBottom = () => {
    if (runsContainer.value) {
      runsContainer.value.scrollTop = runsContainer.value.scrollHeight
    }
  }

  return {
    runs,
    fetchRuns,
    handleEvent,
    scrollToBottom,
    runsContainer,
  }
})