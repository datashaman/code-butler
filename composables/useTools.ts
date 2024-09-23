import { promises as fs } from "fs"
import { join } from "path"

const getFile = ({ path }) => {
  const file = files.find((file) => file.path === path)
  if (!file) {
    throw new Error(`File "${path}" not found`)
  }
  return file
}

export const useTools = async (project) => {
  const normalizePath = (path) => {
    return join(project.path, path)
  }

  const functions = {
    getCurrentTime: () => {
      return {
        time: new Date().toLocaleTimeString(),
      }
    },
    saveFile: async ({ path, contents }) => {
      try {
        await fs.writeFile(normalizePath(path), contents)

        return {
          success: true,
        }
      } catch (e) {
        return {
          success: false,
          error: e.message,
        }
      }
    },
    listFiles: async () => {
      try {
        const files = await fs.readdir(project.path)

        return {
          success: true,
          files,
        }
      } catch (e) {
        return {
          success: false,
          error: e.message,
        }
      }
    },
    moveFile: async ({ from, to }) => {
      try {
        await fs.rename(normalizePath(from), normalizePath(to))

        return {
          success: true,
        }
      } catch (e) {
        return {
          success: false,
          error: e.message,
        }
      }
    },
    removeFile: async ({ path }) => {
      try {
        await fs.unlink(normalizePath(path))

        return {
          success: true,
        }
      } catch (e) {
        return {
          success: false,
          error: e.message,
        }
      }
    },
    getFileContents: async ({ path }) => {
      try {
        const contents = await fs.readFile(normalizePath(path), "utf-8")

        return {
          success: true,
          contents,
        }
      } catch (e) {
        return {
          success: false,
          error: e.message,
        }
      }
    },
  }

  const tools = {
    getCurrentTime: {
      type: "function",
      function: {
        name: "getCurrentTime",
      },
    },
    saveFile: {
      type: "function",
      function: {
        name: "saveFile",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
            },
            contents: {
              type: "string",
            },
          },
          required: ["path", "contents"],
          additionalProperties: false,
        },
      },
    },
    listFiles: {
      type: "function",
      function: {
        name: "listFiles",
      },
    },
    moveFile: {
      type: "function",
      function: {
        name: "moveFile",
        parameters: {
          type: "object",
          properties: {
            from: {
              type: "string",
            },
            to: {
              type: "string",
            },
          },
          required: ["from", "to"],
          additionalProperties: false,
        },
      },
    },
    removeFile: {
      type: "function",
      function: {
        name: "removeFile",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
      },
    },
    getFileContents: {
      type: "function",
      function: {
        name: "getFileContents",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
      },
    },
  }

  const allTools = () => {
    return Object.values(tools)
  }

  const getTools = (names) => {
    return names.map((name) => {
      return tools[name]
    })
  }

  const runTool = async (name, args) => {
    if (!functions[name]) {
      throw new Error(`Tool "${name}" not found`)
    }

    return functions[name](args)
  }

  const handleToolCall = async (toolCall) => {
    console.log("Handling tool call:", toolCall)
    const args = JSON.parse(toolCall.function.arguments)
    const response = runTool(toolCall.function.name, args)

    const attributes = {
      projectId: project.id,
      assistantId: project.assistantId,
      tool: toolCall.function.name,
      args,
      response,
    }

    const action = useDB()
      .insert(tables.actions)
      .values(attributes)
      .returning()
      .get()

    return response
  }

  return {
    allTools,
    getTools,
    handleToolCall,
    runTool,
  }
}
