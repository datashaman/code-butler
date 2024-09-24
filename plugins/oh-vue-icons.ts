import { OhVueIcon, addIcons } from "oh-vue-icons"
import {
  BiArrowUpCircleFill,
  BiCircleFill,
  BiPencilSquare,
  BiPlusSquare,
  IoMicCircle,
  MdCancel,
  OiSidebarCollapse,
  OiSidebarExpand,
} from "oh-vue-icons/icons"
// Import Vue and oh-vue-icons components
import { createApp } from "vue"
import { OhVueIcon, addIcons } from "oh-vue-icons"

// Import icons from Heroicons or any other sets
import {
  HiClock, // queued
  HiRefresh, // in_progress (spinner-like)
  HiExclamation, // requires_action
  HiBan, // cancelling
  HiXCircle, // cancelled
  HiX, // failed
  HiCheckCircle, // completed
  HiMinusCircle, // incomplete
  FaRegularHourglass, // expired
} from "oh-vue-icons/icons"

// Add the imported icons to oh-vue-icons
addIcons(
  HiClock,
  HiRefresh,
  HiExclamation,
  HiBan,
  HiXCircle,
  HiX,
  HiCheckCircle,
  HiMinusCircle,
  FaRegularHourglass,
)

addIcons(
  OiSidebarExpand,
  OiSidebarCollapse,
  BiArrowUpCircleFill,
  BiCircleFill,
  BiPencilSquare,
  BiPlusSquare,
  IoMicCircle,
  MdCancel,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("v-icon", OhVueIcon)
})
