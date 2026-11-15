<!-- app/components/ui/AlertBanner.vue
     ONE compact banner: the most urgent open alert, plus "+N more". Banners must not
     pile up and hide the screen (team feedback). -->
<script setup lang="ts">
import type { Alert } from '~/types'

const { open, silence } = useAlerts()
const { start, selectTarget } = useTriage()
const { isCrewWide } = useProtocols()

// most urgent first: sounding before silenced, CRITICAL before WARNING, newest first
const rank = (a: Alert) => (a.status === 'ACTIVE' ? 0 : 2) + (a.level === 'CRITICAL' ? 0 : 1)
const sorted = computed(() => [...open.value].sort((a, b) => rank(a) - rank(b) || b.ts - a.ts))
const top = computed(() => sorted.value[0])
const more = computed(() => sorted.value.length - 1)
// first sentence only ("Oxygen is low (84%)"): the advice comes in the emergency steps
const short = computed(() => top.value?.message.split('. ')[0]?.replace(/\.$/, ''))

async function startEmergency(problemId?: string) {
  start(problemId ?? null) // the "Who needs help?" page then silences every alarm
  if (problemId && isCrewWide(problemId)) {
    selectTarget('CREW') // e.g. radiation: everyone is affected (gap analysis B-7)
    return navigateTo('/emergency/severity')
  }
  await navigateTo('/emergency') // step 1: who needs help?
}
</script>

<template>
  <div v-if="top">
    <div
      class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5"
      :class="
        top.status === 'SILENCED'
          ? 'bg-sev-moderate text-space-900'
          : top.level === 'CRITICAL'
            ? 'bg-sev-critical text-white'
            : 'border-y-2 border-sev-moderate bg-space-800 text-white'
      "
      :role="top.status === 'ACTIVE' && top.level === 'CRITICAL' ? 'alert' : 'status'"
    >
      <p class="line-clamp-2 min-w-0 flex-1 basis-48 text-lg font-bold leading-snug">
        <template v-if="top.status === 'SILENCED'">🔕 Watching: </template>
        <template v-else-if="top.level === 'CRITICAL'">🚨 </template>
        <span v-else class="text-sev-moderate-text">ⓘ WATCH: </span>
        {{ short }}
        <span v-if="more" class="font-normal"> · +{{ more }} more</span>
      </p>
      <div class="flex shrink-0 gap-2">
        <button
          type="button"
          class="min-h-11 rounded-lg px-3 text-base font-bold"
          :class="top.status === 'SILENCED' ? 'bg-space-900 text-white' : 'bg-white text-space-900'"
          @click="startEmergency(top.problemId)"
        >
          START EMERGENCY
        </button>
        <button
          v-if="top.status === 'ACTIVE'"
          type="button"
          class="min-h-11 rounded-lg border-2 border-white/70 px-3 text-base"
          @click="silence(top.id)"
        >
          {{ top.level === 'CRITICAL' ? "🔕 I'm OK" : 'Got it' }}
        </button>
      </div>
    </div>
  </div>
</template>
