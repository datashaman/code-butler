import { OhVueIcon, addIcons } from "oh-vue-icons"
import {
  BiArrowUpCircleFill,
  BiPencilSquare,
  BiPlusSquare,
  MdCancel,
  OiSidebarCollapse,
  OiSidebarExpand,
} from "oh-vue-icons/icons"

addIcons(
  OiSidebarExpand,
  OiSidebarCollapse,
  BiArrowUpCircleFill,
  BiPencilSquare,
  BiPlusSquare,
  MdCancel,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("v-icon", OhVueIcon)
})
