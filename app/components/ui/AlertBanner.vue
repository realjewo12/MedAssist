<!-- app/components/ui/AlertBanner.vue -->
<script setup lang="ts">
const { active, silenced, silence } = useAlerts()
const { start, selectTarget } = useTriage()
const { isCrewWide } = useProtocols()

async function startEmergency(alertId: string, problemId?: string) {
  silence(alertId) // stop the sound; the problem is still followed
  start(problemId ?? null)
  if (problemId && isCrewWide(problemId)) {
    selectTarget('CREW') // e.g. radiation: everyone is affected (gap analysis B-7)
    return navigateTo('/emergency/severity')
  }
  await navigateTo(problemId ? '/emergency/person' : '/emergency')
}
</script>

<template>
  <div>
    <template v-for="a in active" :key="a.id">
      <!-- CRITICAL: red, with sound -->
      <div v-if="a.level === 'CRITICAL'" class="bg-sev-critical p-4" role="alert">
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
            @click="silence(a.id)"
          >
            🔕 I'm OK – silence
          </button>
        </div>
      </div>

      <!-- WARNING: early notice, amber outline, no sound -->
      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-3 border-4 border-sev-moderate bg-space-800 px-4 py-3"
        role="status"
      >
        <p class="text-lg font-semibold">
          <span class="text-sev-moderate-text">ⓘ WATCH:</span> {{ a.message }}
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="min-h-touch rounded-xl bg-white px-4 text-lg font-bold text-space-900"
            @click="startEmergency(a.id, a.problemId)"
          >
            START EMERGENCY
          </button>
          <button
            type="button"
            class="min-h-touch rounded-xl border-2 border-white/60 px-4 text-lg"
            @click="silence(a.id)"
          >
            Got it
          </button>
        </div>
      </div>
    </template>

    <!-- silenced: no sound, but the problem is not over yet -->
    <div
      v-for="a in silenced"
      :key="a.id"
      class="flex flex-wrap items-center justify-between gap-3 bg-sev-moderate px-4 py-3 text-space-900"
      role="status"
    >
      <p class="text-lg font-semibold">
        🔕 Still watching: {{ a.message }}
        <span class="block text-base font-normal">
          {{
            a.level === 'CRITICAL'
              ? `Alarm silenced. It sounds again in ${SILENCE_MINUTES} min if this does not improve.`
              : `Shown again in ${SILENCE_MINUTES} min if this does not improve.`
          }}
        </span>
      </p>
      <button
        type="button"
        class="min-h-touch rounded-xl bg-space-900 px-4 text-lg font-bold text-white"
        @click="startEmergency(a.id, a.problemId)"
      >
        START EMERGENCY
      </button>
    </div>
  </div>
</template>
