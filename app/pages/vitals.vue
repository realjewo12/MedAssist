<!-- app/pages/vitals.vue -->
<script setup lang="ts">
import type { Scenario } from '~/types'

const { latest, scenario, setScenario, baseline } = useVitals()
const { setRecentEVA, setGravityPhase } = useMission()

const scenarios: { id: Scenario; label: string }[] = [
  { id: 'normal', label: '🙂 Normal' },
  { id: 'hypoxia', label: '🫁 Low oxygen' },
  { id: 'fall', label: '🤕 Fall (on the Moon)' },
  { id: 'eva-suit', label: '🧑‍🚀 Suit problem (spacewalk)' },
  { id: 'faint', label: '😵 Faint' },
]

function choose(s: Scenario) {
  // a suit problem happens during a spacewalk: triage should know (gap analysis B-4)
  if (s === 'eva-suit') setRecentEVA(true)
  // in orbit nobody falls (gap analysis C-3): a fall happens on a surface
  if (s === 'fall') setGravityPhase('lunar')
  setScenario(s)
}
</script>

<template>
  <div>
    <h1 class="mb-4 text-3xl font-bold">Live vitals</h1>
    <div class="grid grid-cols-2 gap-4">
      <VitalsTile vital="hr" :value="latest?.hr ?? null" />
      <VitalsTile vital="spo2" :value="latest?.spo2 ?? null" />
      <VitalsTile vital="rr" :value="latest?.rr ?? null" />
      <VitalsTile vital="skinTemp" :value="latest?.skinTemp ?? null" />
    </div>

    <!-- gap analysis C-2 -->
    <p class="mt-4 text-base text-white/70" role="status">
      <template v-if="baseline">
        Your normal: {{ Math.round(baseline.hr) }} bpm · {{ baseline.skinTemp.toFixed(1) }} °C.
        WATCH starts 20 % above your normal heart rate and 1 °C above your normal temperature.
      </template>
      <template v-else>
        Learning your normal values (needs about 1 minute of safe readings)…
      </template>
    </p>

    <section class="mt-8 rounded-2xl bg-space-800 p-4">
      <h2 class="text-xl font-semibold">Demo: simulator scenario</h2>
      <p class="text-base text-white/70">Changes the fake sensor data. Use it during the demo.</p>
      <div class="mt-3 flex flex-wrap gap-3">
        <button
          v-for="s in scenarios"
          :key="s.id"
          type="button"
          class="min-h-touch rounded-xl px-5 text-xl"
          :class="scenario === s.id ? 'bg-blue-700' : 'bg-space-700'"
          @click="choose(s.id)"
        >
          {{ s.label }}
        </button>
      </div>
    </section>
  </div>
</template>
