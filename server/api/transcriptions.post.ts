import fs from "fs"
import { Readable } from "stream"
import { useValidatedParams, zh } from "h3-zod"

import formidable from "formidable"
import fs from "fs"
import { IncomingMessage } from "http"
import OpenAI from "openai"

const openai = new OpenAI()

const parseForm = async (
  req: IncomingMessage,
): Promise<{ file: formidable.File }> => {
  const form = formidable({ multiples: false })

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files as { file: formidable.File })
      }
    })
  })
}

export default defineEventHandler(async (event) => {
  const { file } = await parseForm(event.node.req)
  const newFilename = `${file[0].filepath}.ogg`
  await fs.promises.rename(file[0].filepath, newFilename)
  const fileStream = fs.createReadStream(newFilename)

  const params = {
    model: "whisper-1",
    file: fileStream,
  }

  const transcription = await openai.audio.transcriptions.create(params)

  return {
    transcription: transcription.text,
  }
})
