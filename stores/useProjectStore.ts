export const useProjectStore = defineStore("projects", () => {
  const projects = ref([])

  const fetchProject = async (projectId) => {
    const { project } = await $fetch(`/api/projects/${projectId}`)
    return project
  }

  const fetchProjects = async () => {
    const { projects: data } = await $fetch("/api/projects")
    projects.value = data
  }

  const createProject = async (attributes) => {
    const { project } = await $fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify(attributes),
    })

    projects.value.push(project)
    projects.value = projects.value.sort((a, b) => a.name.localeCompare(b.name))

    return project
  }

  const updateProject = async (projectId, attributes) => {
    const { project } = await $fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(attributes),
    })

    const index = projects.value.findIndex((p) => p.id == projectId)
    projects.value[index] = project

    return project
  }

  const deleteProject = async (projectId) => {
    const response = await $fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    })

    projects.value = projects.value.filter((p) => p.id != projectId)
  }

  return {
    fetchProject,
    fetchProjects,
    projects,
    createProject,
    updateProject,
    deleteProject,
  }
})
