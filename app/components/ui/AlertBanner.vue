<!-- app/components/ui/AlertBanner.vue -->
<script setup lang="ts">
const { active, acknowledge } = useAlerts()
const { start } = useTriage()

async function startEmergency(alertId: string, problemId?: string) {
  acknowledge(alertId)
  start(problemId ?? null)
  await navigateTo(problemId ? '/emergency/person' : '/emergency')
}
</script>

<template>
  <div v-for="a in active" :key="a.id" class="bg-sev-critical p-4" role="alert">
    <p class="text-2xl font-bold">🚨 {{ a.message }}</p>
    <div class="mt-3 flex flex-wrap gap-3">
      <button
        type="button"
        class="min-h-touch rounded-xl bg-white px-5 text-xl font-bold text-sev-critical"
        @click="startEmergency(a.id, a.problemId)"
      >
        START EMERGENCY
      </button>
      <button
        type="button"
        class="min-h-touch rounded-xl border-2 border-white px-5 text-xl"
        @click="acknowledge(a.id)"
      >
        I'm OK – dismiss
      </button>
    </div>
  </div>
</template>
