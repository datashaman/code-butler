import { OhVueIcon, addIcons } from "oh-vue-icons"
import { OiSidebarExpand, OiSidebarCollapse } from "oh-vue-icons/icons"
import {
  BiArrowUpCircleFill,
  BiPencilSquare,
  BiPlusSquareFill,
} from "oh-vue-icons/icons"

addIcons(
  OiSidebarExpand,
  OiSidebarCollapse,
  BiArrowUpCircleFill,
  BiPencilSquare,
  BiPlusSquareFill,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("v-icon", OhVueIcon)
})
