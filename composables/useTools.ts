import { promises as fs } from "fs"
import { join } from "path"
import { simpleGit, SimpleGit } from "simple-git"

const safelyRun = async (fn) => {
  try {
    return await fn()
  } catch (e) {
    return {
      success: false,
      error: e.message,
    }
  }
}

const getFile = ({ path }) => {
  const file = files.find((file) => file.path === path)
  if (!file) {
    throw new Error(`File "${path}" not found`)
  }
  return file
}

export const useTools = async (project) => {
  const git: SimpleGit = simpleGit({
    baseDir: project.path,
  })

  const normalizePath = (path) => {
    return join(project.path, path)
  }

  const getProject = async () => {
    return useDB()
      .select()
      .from(tables.projects)
      .where(eq(tables.projects.id, project.id))
      .limit(1)
      .get()
  }

  const functions = {
    getCurrentTime: () => {
      return {
        success: true,
        time: new Date().toLocaleTimeString(),
      }
    },
    getProjectFacts: async () => {
      return safelyRun(async () => {
        const project = await getProject()

        return {
          success: true,
          facts: project.facts,
        }
      })
    },
    setProjectFacts: async ({ facts }) => {
      return safelyRun(async () => {
        useDB()
          .update(tables.projects)
          .set({
            facts,
          })
          .where(eq(tables.projects.id, project.id))
          .run()

        return {
          success: true,
        }
      })
    },
    addProjectFact: async ({ fact }) => {
      return safelyRun(async () => {
        const project = await getProject()

        useDB()
          .update(tables.projects)
          .set({
            facts: [...project.facts, fact],
          })
          .where(eq(tables.projects.id, project.id))
          .run()

        return {
          success: true,
        }
      })
    },
    removeProjectFact: async ({ fact }) => {
      return safelyRun(async () => {
        const project = await getProject()

        useDB()
          .update(tables.projects)
          .set({
            facts: project.facts.filter((f) => f !== fact),
          })
          .where(eq(tables.projects.id, project.id))
          .run()

        return {
          success: true,
        }
      })
    },
    saveFile: async ({ path, contents }) => {
      return safelyRun(async () => {
        await fs.writeFile(normalizePath(path), contents)

        return {
          success: true,
        }
      })
    },
    listFiles: async ({ path }) => {
      path = normalizePath(path || "/")

      return safelyRun(async () => {
        const files = await fs.readdir(path)

        return files.map((file) => {
          return {
            name: file,
            type: "file",
          }
        })
      })
    },
    moveFile: async ({ from, to }) => {
      return safelyRun(async () => {
        await fs.rename(normalizePath(from), normalizePath(to))

        return {
          success: true,
        }
      })
    },
    removeFile: async ({ path }) => {
      return safelyRun(async () => {
        await fs.unlink(normalizePath(path))

        return {
          success: true,
        }
      })
    },
    getFileContents: async ({ path }) => {
      return safelyRun(async () => {
        const contents = await fs.readFile(normalizePath(path), "utf-8")

        return {
          success: true,
          contents,
        }
      })
    },
    commitChanges: async ({ message }) => {
      return safelyRun(async () => {
        await git.add(".")
        await git.commit(message)

        return {
          success: true,
        }
      })
    },
    undoChanges: async () => {
      return safelyRun(async () => {
        await git.revert("HEAD")

        return {
          success: true,
        }
      })
    },
    pushChanges: async () => {
      return safelyRun(async () => {
        await git.push()

        return {
          success: true,
        }
      })
    },
  }

  const tools = {
    getCurrentTime: {
      type: "function",
      function: {
        name: "getCurrentTime",
      },
    },
    getProjectFacts: {
      type: "function",
      function: {
        name: "getProjectFacts",
        description: "Get the facts of the project",
      },
    },
    setProjectFacts: {
      type: "function",
      function: {
        name: "setProjectFacts",
        description: "Set the facts of the project",
        parameters: {
          type: "object",
          properties: {
            facts: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["facts"],
          additionalProperties: false,
        },
      },
    },
    addProjectFact: {
      type: "function",
      function: {
        name: "addProjectFact",
        description: "Add a fact to the project",
        parameters: {
          type: "object",
          properties: {
            fact: {
              type: "string",
            },
          },
          required: ["fact"],
          additionalProperties: false,
        },
      },
    },
    removeProjectFact: {
      type: "function",
      function: {
        name: "removeProjectFact",
        description: "Remove a fact from the project",
        parameters: {
          type: "object",
          properties: {
            fact: {
              type: "string",
            },
          },
          required: ["fact"],
          additionalProperties: false,
        },
      },
    },
    commitChanges: {
      type: "function",
      function: {
        name: "commitChanges",
        description:
          "Commit all changes in the project, including deleted files and directories",
        parameters: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
          },
          required: ["message"],
          additionalProperties: false,
        },
      },
    },
    undoChanges: {
      type: "function",
      function: {
        name: "undoChanges",
        description: "Undo the latest change.",
      },
    },
    pushChanges: {
      type: "function",
      function: {
        name: "pushChanges",
        description: "Push the changes to the remote repository.",
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
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              default: "/",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
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
    const response = await runTool(toolCall.function.name, args)

    const attributes = {
      projectId: project.id,
      assistantId: project.assistantId,
      tool: toolCall.function.name,
      args,
      response,
    }

    useDB().insert(tables.actions).values(attributes).execute()

    return response
  }

  return {
    allTools,
    getTools,
    handleToolCall,
    runTool,
  }
}
