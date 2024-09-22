export const useAssistantStore = defineStore("assistants", () => {
  const assistants = ref([])

  const fetchAssistant = async (assistantId) => {
    const { assistant } = await $fetch(`/api/assistants/${assistantId}`)
    return assistant
  }

  const fetchAssistants = async () => {
    const { assistants: data } = await $fetch("/api/assistants")
    assistants.value = data
  }

  const createAssistant = async (attributes) => {
    const { assistant } = await $fetch("/api/assistants", {
      method: "POST",
      body: JSON.stringify(attributes),
    })

    assistants.value.push(assistant)
    assistants.value = assistants.value.sort((a, b) =>
      a.name.localeCompare(b.name),
    )

    return assistant
  }

  const updateAssistant = async (assistantId, attributes) => {
    const { assistant } = await $fetch(`/api/assistants/${assistantId}`, {
      method: "PUT",
      body: JSON.stringify(attributes),
    })

    const index = assistants.value.findIndex((a) => a.id == assistantId)
    assistants.value[index] = assistant

    return assistant
  }

  const deleteAssistant = async (assistantId) => {
    const response = await $fetch(`/api/assistants/${assistantId}`, {
      method: "DELETE",
    })

    assistants.value = assistants.value.filter((a) => a.id != assistantId)
  }

  return {
    fetchAssistant,
    fetchAssistants,
    assistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  }
})
