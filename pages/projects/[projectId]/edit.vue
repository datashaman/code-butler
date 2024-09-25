<template>
  <div class="w-1/3 p-4">
    <h2 class="font-bold text-xl pb-4">Edit Project</h2>
    <ClientOnly>
      <FormProject :projectId="$route.params.projectId" />
    </ClientOnly>
  </div>
</template>
