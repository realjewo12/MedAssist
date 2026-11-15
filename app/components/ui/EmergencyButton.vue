<!-- app/components/ui/EmergencyButton.vue -->
<script setup lang="ts">
const { start } = useTriage()

async function go() {
  start() // new triage session
  await navigateTo('/emergency')
}
</script>

<template>
  <button
    type="button"
    class="fixed bottom-4 right-4 z-40 min-h-touch rounded-full bg-sev-critical px-8 py-4 text-2xl font-bold shadow-lg focus-visible:ring-4 focus-visible:ring-white"
    @click="go"
  >
    🚨 EMERGENCY
  </button>
</template>
