import { useValidatedBody, z } from "h3-zod"
import { OpenAI } from "openai"
import { projectSchema } from "~/schemas/projectSchema"
import { promises as fs } from "fs"
import { exec } from "child_process"

// Create a github repository from a template
const bootstrapProject = async (values) => {
  const { path, template } = values

  await fs.mkdir(path)

  exec(
    `./scripts/bootstrap.sh ${template} ${path}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }

      console.log(`stdout: ${stdout}`)
      console.error(`stderr: ${stderr}`)
    },
    {
      cwd: path,
    },
  )
}

export default eventHandler(async (event) => {
  const values = await useValidatedBody(event, projectSchema)

  try {
    const stats = await fs.stat(values.path)

    if (!stats.isDirectory()) {
      throw new Error("Path must be a directory")
    }
  } catch (e) {
    if (e.code === "ENOENT") {
      if (values.template) {
        bootstrapProject(values)
      }
    } else {
      console.error("Error: ", e)
    }

    throw e
  }

  const openai = new OpenAI()

  const thread = await openai.beta.threads.create({})
  values.threadId = thread.id

  const project = useDB()
    .insert(tables.projects)
    .values(values)
    .returning()
    .get()

  return {
    project,
  }
})
