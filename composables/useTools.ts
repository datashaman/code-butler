import { promises as fs } from "fs"
import { join } from "path"

const getFile = ({ path }) => {
  const file = files.find((file) => file.path === path)
  if (!file) {
    throw new Error(`File "${path}" not found`)
  }
  return file
}

export const useTools = async () => {
  const BASE_FOLDER = await fs.realpath("components")

  const normalizePath = (path) => {
    return join(BASE_FOLDER, path)
  }

  const functions = {
    getCurrentTime: () => {
      return {
        time: new Date().toLocaleTimeString(),
      }
    },
    saveFile: async ({ path, contents }) => {
      await fs.writeFile(normalizePath(path), contents)

      return {
        success: true,
      }
    },
    listFiles: async () => {
      const files = await fs.readdir(BASE_FOLDER)

      return {
        success: true,
        files,
      }
    },
    moveFile: async ({ from, to }) => {
      await fs.rename(normalizePath(from), normalizePath(to))

      return {
        success: true,
      }
    },
    removeFile: async ({ path }) => {
      await fs.unlink(normalizePath(path))

      return {
        success: true,
      }
    },
    getFileContents: async ({ path }) => {
      const contents = fs.readFile(normalizePath(path), "utf-8")

      return {
        success: true,
        contents,
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
    return runTool(toolCall.function.name, args)
  }

  return {
    allTools,
    getTools,
    handleToolCall,
    runTool,
  }
}
