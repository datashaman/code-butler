<script setup lang="ts">
import { marked } from "marked"
import markedLinkifyIt from "marked-linkify-it"
import DOMPurify from "dompurify"

marked
  .use({
    breaks: true,
  })
  .use(markedLinkifyIt())

const renderMarkdown = (content) => {
  const html = marked.parseInline(content)
  return DOMPurify.sanitize(html)
}

const {
  messagesContainer,
  messages,
  sendMessage,

  fetchMessages,
  scrollToBottom,
} = useChat()

const newMessage = ref("")
const sidebarOpen = ref(false)
const projects = ref([])
const openNewProject = ref(false)
const name = ref("")
const path = ref("")
const description = ref("")
const projectModal = ref(null)
const activeProject = ref(null)
const activeModel = ref(null)
const models = ref([])

const handleSendMessage = async (evt) => {
  if (evt.shiftKey) return
  if (!newMessage.value) return
  evt.preventDefault()
  const content = newMessage.value + ""
  newMessage.value = ""

  await sendMessage(activeProject.value, content, activeModel.value)
}

const newProject = async () => {
  openNewProject.value = true
}

const createProject = async () => {
  try {
    const { project } = await $fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: name.value,
        path: path.value,
        description: description.value,
      }),
    })

    projects.value.push(project)
    projects.value.sort((a, b) => a.name.localeCompare(b.name))

    activeProject.value = project

    return closeProjectModal()
  } catch (e) {
    if (e.name === "AbortError") {
      console.log("User canceled")
    } else {
      throw e
    }
  }
}

const updateProject = async () => {
  try {
    const { project } = await $fetch(
      `/api/projects/${activeProject.value.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: activeProject.value.name,
          path: activeProject.value.path,
          description: activeProject.value.description,
        }),
      },
    )

    const index = projects.value.findIndex((p) => p.id === project.id)
    projects.value[index] = project
  } catch (e) {
    if (e.name === "AbortError") {
      console.log("User canceled")
    } else {
      throw e
    }
  }
}

const resetProject = async () => {
  const { project } = await $fetch(`/api/projects/${activeProject.value.id}`)
  activeProject.value = project
}

const closeProjectModal = async () => {
  name.value = ""
  description.value = ""
  projectModal.value.close()
}

const deleteProject = async () => {
  try {
    await $fetch(`/api/projects/${activeProject.value.id}`, {
      method: "DELETE",
    })

    const index = projects.value.findIndex(
      (p) => p.id === activeProject.value.id,
    )
    projects.value.splice(index, 1)

    activeProject.value = null
  } catch (e) {
    if (e.name === "AbortError") {
      console.log("User canceled")
    } else {
      throw e
    }
  }
}

watch(
  activeProject,
  (value) => {
    nextTick(async () => {
      if (value) {
        localStorage.setItem("activeProject", JSON.stringify(value))
        await fetchMessages(value.threadId)
      } else {
        localStorage.removeItem("activeProject")
        messages.value = []
      }
    })
  },
  { deep: true },
)

watch(
  sidebarOpen,
  (value) => {
    localStorage.setItem("sidebarOpen", JSON.stringify(value))
  },
  { deep: true },
)

watch(
  activeModel,
  (value) => {
    nextTick(() => {
      if (value) {
        localStorage.setItem("activeModel", JSON.stringify(value))
      } else {
        localStorage.removeItem("activeModel")
      }
    })
  },
  { deep: true },
)

onMounted(async () => {
  const sidebarValue = localStorage.getItem("sidebarOpen")

  if (sidebarValue) {
    sidebarOpen.value = JSON.parse(sidebarValue)
  }

  const { models: modelData } = await $fetch("/api/models")
  models.value = modelData

  const modelValue = localStorage.getItem("activeModel")

  if (modelValue) {
    const model = JSON.parse(modelValue)
    activeModel.value = model
  }

  const { projects: projectData } = await $fetch("/api/projects")
  projects.value = projectData

  const value = localStorage.getItem("activeProject")

  if (value) {
    const project = JSON.parse(value)
    activeProject.value = projects.value.find((p) => p.id === project.id)
  }

  if (activeProject.value) {
    await fetchMessages(activeProject.value.threadId)
    scrollToBottom()
  }
})
</script>
<template>
  <div class="flex flex-row">
    <div v-if="sidebarOpen" class="flex-none w-80 py-2 bg-base-200">
      <ul class="menu">
        <li><button @click="projectModal.showModal()">New Project</button></li>
        <li><h2 class="menu-title">Projects</h2></li>
        <li v-for="project in projects" :key="project.id">
          <a
            :class="{ active: activeProject && activeProject === project }"
            @click.prevent="activeProject = project"
            >{{ project.name || "..." }}</a
          >
        </li>
      </ul>

      <div v-if="activeProject" class="sidebar flex flex-col gap-2">
        <h2>Settings</h2>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Path</span>
          </label>
          <input
            v-model="activeProject.path"
            type="text"
            class="input"
            placeholder="Project Path"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Name</span>
          </label>
          <input
            v-model="activeProject.name"
            type="text"
            class="input"
            placeholder="Project Name"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea
            v-model="activeProject.description"
            class="textarea"
            placeholder="Project Description"
            rows="10"
          />
        </div>

        <div class="mt-2 flex justify-between">
          <button class="btn btn-error" @click="deleteProject">Delete</button>
          <button class="btn btn-secondary" @click="resetProject">Reset</button>
          <button class="btn btn-primary" @click="updateProject">Save</button>
        </div>
      </div>
    </div>
    <div class="flex-1 flex flex-col bg-base-100 h-screen">
      <div class="navbar text-neutral z-10">
        <div class="navbar-start">
          <ul class="menu menu-horizontal px-1">
            <button v-if="sidebarOpen" @click="sidebarOpen = false">
              <v-icon name="oi-sidebar-collapse" />
            </button>
            <button v-else @click="sidebarOpen = true">
              <v-icon name="oi-sidebar-expand" />
            </button>
            <li>
              <details ref="modelDetails">
                <summary>
                  <span v-if="activeModel">{{ activeModel }}</span>
                  <span v-else>Model</span>
                </summary>
                <ul class="bg-base-100 rounded-t-none min-w-60">
                  <li><h2 class="menu-title">Model</h2></li>
                  <li v-for="model in models" :key="model.id">
                    <a
                      :class="{ active: activeModel && activeModel === model }"
                      @click="
                        (activeModel = model),
                          $refs.modelDetails.removeAttribute('open')
                      "
                      >{{ model }}</a
                    >
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4">
        <template v-for="message in messages" :key="message.id">
          <div v-if="message.role === 'assistant'" class="chat chat-start">
            <div class="chat-bubble bg-white text-black">
              <span
                v-if="message.content[0].text.value === '...'"
                class="loading loading-dots"
              />
              <span
                v-else
                v-html="renderMarkdown(message.content[0].text.value)"
              />
            </div>
          </div>
          <div v-else class="chat chat-end">
            <div class="chat-bubble bg-base-200 text-black">
              <span v-html="renderMarkdown(message.content[0].text.value)" />
            </div>
          </div>
        </template>
      </div>

      <div class="w-2/3 mx-auto">
        <div class="flex flex-row p-4 gap-2 w-full">
          <div class="flex-grow">
            <textarea
              v-model="newMessage"
              type="text"
              class="textarea bg-base-200 w-full"
              placeholder="Type your message here..."
              rows="1"
              @keyup.enter="handleSendMessage"
            />
          </div>
          <button class="btn-circle ml-2" @click="handleSendMessage">
            <v-icon
              scale="2"
              name="bi-arrow-up-circle-fill"
              class="text-base-300"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
  <dialog ref="projectModal" class="modal">
    <div class="modal-box">
      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Name</div>
        </div>
        <input
          type="text"
          class="input input-bordered"
          placeholder="Project Name"
          v-model="name"
          required
        />
      </div>
      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Path</div>
        </div>
        <input
          type="text"
          class="input input-bordered"
          placeholder="Project Path"
          v-model="path"
          required
        />
      </div>
      <div class="form-control w-full">
        <div class="label">
          <div class="label-text">Description</div>
        </div>
        <textarea
          class="textarea textarea-bordered textarea-sm w-full"
          placeholder="Project Description"
        />
      </div>
      <div class="modal-action">
        <button class="btn btn-secondary" @click="closeProjectModal">
          Cancel
        </button>
        <button class="btn btn-primary" @click="createProject">Create</button>
      </div>
    </div>
  </dialog>
</template>
<style>
.sidebar {
  padding: 1.5rem;
}
</style>
