import fs from "fs"
import path from "path"

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      threadId: process.env.OPENAI_THREAD_ID,
    },
  },
})
