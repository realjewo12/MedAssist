<!-- app/pages/vitals.vue -->
<script setup lang="ts">
import type { Scenario } from '~/types'

const { latest, scenario, setScenario } = useVitals()

const scenarios: { id: Scenario; label: string }[] = [
  { id: 'normal', label: '🙂 Normal' },
  { id: 'hypoxia', label: '🫁 Low oxygen' },
  { id: 'fall', label: '🤕 Fall' },
]
</script>

<template>
  <div>
    <h1 class="mb-4 text-3xl font-bold">Live vitals</h1>
    <div class="grid grid-cols-2 gap-4">
      <VitalsTile
        label="Heart rate"
        :value="latest?.hr ?? null"
        unit="bpm"
        v-bind="VITAL_LIMITS.hr"
      />
      <VitalsTile
        label="Oxygen (SpO2)"
        :value="latest?.spo2 ?? null"
        unit="%"
        v-bind="VITAL_LIMITS.spo2"
      />
      <VitalsTile
        label="Breathing"
        :value="latest?.rr ?? null"
        unit="/min"
        v-bind="VITAL_LIMITS.rr"
      />
      <VitalsTile
        label="Skin temperature"
        :value="latest?.skinTemp ?? null"
        unit="°C"
        v-bind="VITAL_LIMITS.skinTemp"
      />
    </div>

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
          @click="setScenario(s.id)"
        >
          {{ s.label }}
        </button>
      </div>
    </section>
  </div>
</template>
