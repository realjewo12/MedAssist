<!-- app/pages/emergency/index.vue   step 1: who needs help? (asked first) -->
<script setup lang="ts">
import type { Target } from '~/types'

definePageMeta({ layout: 'emergency' })

const { state, start, selectTarget, selectProblem } = useTriage()
const { problems } = useProtocols()
const { silenceAll } = useAlerts()

// opened with the EMERGENCY button or by URL: a new session
if (!state.value.sessionId) start()
// the alarms are being taken care of now: stop their sound and banners
silenceAll()

async function choose(target: Target) {
  selectTarget(target)
  const preset = state.value.problemId // already known when started from an alert banner
  const presetFits = !(target === 'SELF' && problems.find((p) => p.id === preset)?.notForSelf)
  if (preset && presetFits) return navigateTo('/emergency/severity')
  if (preset) selectProblem('') // e.g. "Not responding" does not fit ME: choose again
  await navigateTo('/emergency/problem')
}
</script>

<template>
  <div>
    <EmergencyStepHeader :step="1" title="Who needs help?" />
    <div class="grid gap-4">
      <UiBigButton label="ME" icon="🙋" hint="I am the one in trouble" @click="choose('SELF')" />
      <UiBigButton
        label="MY TEAMMATE"
        icon="🧑‍🚀"
        hint="Someone else needs help"
        @click="choose('TEAMMATE')"
      />
    </div>
  </div>
</template>
