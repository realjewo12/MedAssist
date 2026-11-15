<!-- app/pages/emergency/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'emergency' })

const { problems } = useProtocols()
const { state, start, selectProblem } = useTriage()

if (!state.value.sessionId) start() // opened directly by URL

async function choose(id: string) {
  selectProblem(id)
  await navigateTo('/emergency/person')
}
</script>

<template>
  <div>
    <EmergencyStepHeader :step="1" title="What is the problem?" />
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UiBigButton
        v-for="p in problems"
        :key="p.id"
        :label="p.label"
        :icon="p.icon"
        @click="choose(p.id)"
      />
    </div>
  </div>
</template>
