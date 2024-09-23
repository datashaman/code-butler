<template>
  <Chat :projectId="$route.params.projectId" />
  <Runs :projectId="$route.params.projectId" class="w-1/5 h-screen" />
</template>
