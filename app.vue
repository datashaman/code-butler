<template>
  <div class="flex flex-row">
    <div class="w-80">
      <ClientOnly>
        <SideBar class="h-screen" />
      </ClientOnly>
    </div>
    <NuxtPage class="flex-1" />
    <NuxtSnackbar />
  </div>
</template>
