import fs from "fs"
import path from "path"

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@vueform/nuxt",
    "nuxt-snackbar",
    "@pinia/nuxt",
  ],
  snackbar: {
    bottom: true,
    right: true,
    duration: 5000,
  },
})