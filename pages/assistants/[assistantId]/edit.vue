<template>
  <div class="w-1/3 p-4">
    <h2 class="font-bold text-xl pb-4">Edit Assistant</h2>
    <ClientOnly>
      <FormAssistant :assistantId="$route.params.assistantId" />
    </ClientOnly>
  </div>
</template>
