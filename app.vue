<script setup>
const sidebarOpen = ref(true)

const setSidebarState = (state) => {
  sidebarOpen.value = state
}
</script>
<template>
  <div class="flex flex-row">
    <ClientOnly v-if="sidebarOpen">
      <SideBar
        :open="sidebarOpen"
        class="h-screen w-80"
        @sidebar-state="setSidebarState"
      />
    </ClientOnly>
    <ClientOnly v-else>
      <SideBar
        :open="sidebarOpen"
        class="h-screen"
        @sidebar-state="setSidebarState"
      />
    </ClientOnly>
    <NuxtPage class="flex-1" />
    <NuxtSnackbar />
  </div>
</template>
