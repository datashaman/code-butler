import { promises as fs } from "fs"
import { join } from "path"
import { simpleGit, SimpleGit } from "simple-git"
import { Octokit } from "@octokit/rest"

const safelyRun = async (fn) => {
  try {
    return await fn()
  } catch (e) {
    console.error(e)
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

const parseHttpUrl = (url) => {
  const urlObj = new URL(remote.refs.fetch)
  const pathParts = urlObj.pathname.split("/")
  const owner = pathParts[1]
  const repo = pathParts[2].replace(".git", "")

  return {
    owner,
    repo,
  }
}

const parseSshUrl = (url) => {
  const pathParts = url.split(":")[1].split("/")
  const owner = pathParts[0]
  const repo = pathParts[1].replace(".git", "")

  return {
    owner,
    repo,
  }
}

export const useTools = async (project) => {
  const git: SimpleGit = simpleGit({
    baseDir: project.path,
  })

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
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
    commitChanges: async ({ title, body }) => {
      return safelyRun(async () => {
        await git.add(".")
        await git.commit(`${title}\n\n${body}`)

        return {
          success: true,
        }
      })
    },
    revertCommit: async () => {
      return safelyRun(async () => {
        const result = await git.revert("HEAD")

        return {
          success: true,
          result,
        }
      })
    },
    pushChanges: async () => {
      return safelyRun(async () => {
        const result = await git.push()

        return {
          success: true,
          result,
        }
      })
    },
    pullChanges: async () => {
      return safelyRun(async () => {
        const result = await git.pull()

        return {
          success: true,
          result,
        }
      })
    },
    showDiff: async () => {
      return safelyRun(async () => {
        const diff = await git.diff()

        return {
          success: true,
          diff,
        }
      })
    },
    showStatus: async () => {
      return safelyRun(async () => {
        const status = await git.status()

        return {
          success: true,
          status,
        }
      })
    },
    getCurrentBranch: async () => {
      return safelyRun(async () => {
        const branchSummary = await git.branch()

        return {
          success: true,
          branch: branchSummary.current,
        }
      })
    },
    checkoutBranch: async ({ name }) => {
      return safelyRun(async () => {
        await git.checkout(name)

        return {
          success: true,
        }
      })
    },
    createBranch: async ({ name }) => {
      return safelyRun(async () => {
        await git.checkoutLocalBranch(name)

        return {
          success: true,
        }
      })
    },
    createPullRequest: async ({ title, body }) => {
      return safelyRun(async () => {
        const branchSummary = await git.branch()

        const remotes = await git.getRemotes(true)
        const remote = remotes.find((remote) => remote.name === "origin")
        console.log(remote)

        if (!remote) {
          return {
            success: false,
            error: "No remote 'origin' found",
          }
        }

        const { owner, repo } = remote.refs.fetch.startsWith("https://")
          ? parseHttpUrl(remote.refs.fetch)
          : parseSshUrl(remote.refs.fetch)

        const params = {
          owner,
          repo,
          title,
          body,
          head: branchSummary.current,
          base: "main",
        }

        const { data } = await octokit.pulls.create(params)

        return {
          success: true,
          url: data.html_url,
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
        description: "Get the facts about the project",
      },
    },
    setProjectFacts: {
      type: "function",
      function: {
        name: "setProjectFacts",
        description:
          "Set the facts about the project. Only set facts that appear relevant to the project. If unsure, ask the user.",
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
        description:
          "Add a fact about the project. Only add facts that appear relevant to the project. If unsure, ask the user.",
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
        description: "Remove a fact about the project",
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
          "Commit all changes in the project, including deleted files and directories. Only commit changes on user request.",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title of the commit message",
            },
            body: {
              type: "string",
              description:
                "The body of the commit message, describing the changes. Use GitHub markdown for formatting.",
            },
          },
          required: ["title", "body"],
          additionalProperties: false,
        },
      },
    },
    revertCommit: {
      type: "function",
      function: {
        name: "revertCommit",
        description:
          "Revert the last commit. Only revert commits on user request.",
      },
    },
    pushChanges: {
      type: "function",
      function: {
        name: "pushChanges",
        description:
          "Push the changes to the remote repository. Only push changes on user request.",
      },
    },
    pullChanges: {
      type: "function",
      function: {
        name: "pullChanges",
        description: "Pull the latest changes from the remote repository.",
      },
    },
    showDiff: {
      type: "function",
      function: {
        name: "showDiff",
        description:
          "Show the differences between the working directory and the index.",
      },
    },
    showStatus: {
      type: "function",
      function: {
        name: "showStatus",
        description: "Show the status of the working directory.",
      },
    },
    checkoutBranch: {
      type: "function",
      function: {
        name: "checkoutBranch",
        description: "Switch to a different branch in the project",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the branch to switch to",
            },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    },
    getCurrentBranch: {
      type: "function",
      function: {
        name: "getCurrentBranch",
        description: "Get the name of the current branch",
      },
    },
    createBranch: {
      type: "function",
      function: {
        name: "createBranch",
        description: "Create a new branch in the project",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the new branch",
            },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    },
    createPullRequest: {
      type: "function",
      function: {
        name: "createPullRequest",
        description: "Create a pull request for the current branch",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title of the pull request",
            },
            body: {
              type: "string",
              description:
                "The body of the pull request, describing the changes. Use GitHub markdown for formatting.",
            },
          },
          required: ["title", "body"],
          additionalProperties: false,
        },
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

    return response
  }

  return {
    allTools,
    getTools,
    handleToolCall,
    runTool,
  }
}
