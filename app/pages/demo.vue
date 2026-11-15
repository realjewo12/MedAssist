<!-- app/pages/demo.vue -->
<script setup lang="ts">
import type { GravityPhase } from '~/types'

const { online, setOnline, pendingCount } = useSync()
const { clearAll } = useBlackBox()
const { reset: resetAlerts } = useAlerts()
const { setScenario } = useVitals()
const { context: mission, setRecentEVA, setGravityPhase } = useMission()
const { lastNight, setDemoNights, clear: clearSleep } = useSleep()
const { cumulativeDose, addDemoDose, resetDose } = useEnvironment()

const phases: { id: GravityPhase; label: string }[] = [
  { id: 'micro', label: '🛰️ Orbit (micro-g)' },
  { id: 'lunar', label: '🌕 Moon' },
  { id: 'mars', label: '🔴 Mars' },
  { id: 'landing', label: '🛬 Landing' },
]

function resetDemo() {
  if (!confirm('Delete all black box records, alerts, sleep data and dose?')) return
  clearAll()
  resetAlerts()
  clearSleep()
  resetDose()
  setScenario('normal')
}
</script>

<template>
  <div class="grid gap-6">
    <h1 class="text-3xl font-bold">Demo controls</h1>

    <section class="rounded-2xl bg-space-800 p-4">
      <h2 class="text-xl font-semibold">Base link</h2>
      <p class="text-lg">
        Now: {{ online ? 'connected' : `offline (${pendingCount} records waiting)` }}
      </p>
      <button
        type="button"
        class="mt-3 min-h-touch rounded-xl px-5 text-xl font-bold"
        :class="online ? 'bg-amber-500 text-black' : 'bg-sev-low'"
        @click="setOnline(!online)"
      >
        {{ online ? '📴 Cut the link' : '📡 Restore the link' }}
      </button>
    </section>

    <!-- gap analysis C-7 and D-6: slow risks, shown in seconds for the demo -->
    <section class="rounded-2xl bg-space-800 p-4">
      <h2 class="text-xl font-semibold">Sleep and dose (demo)</h2>
      <p class="text-base text-white/70">
        Sleep is counted from still periods (use 😴 Sleeping on the Vitals page). These buttons fill
        past nights and add a dose so the home score can be shown quickly.
      </p>
      <p class="mt-2 text-lg">
        Last night:
        {{ lastNight === null ? 'no data' : `${lastNight.toFixed(1)} h` }} · dose since start:
        {{ Math.round(cumulativeDose) }} µGy
      </p>
      <div class="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          class="min-h-touch rounded-xl bg-space-700 px-4 text-lg"
          @click="setDemoNights([4, 4.5, 5])"
        >
          🥱 3 short nights
        </button>
        <button
          type="button"
          class="min-h-touch rounded-xl bg-space-700 px-4 text-lg"
          @click="setDemoNights([8, 7.5, 8])"
        >
          😴 3 good nights
        </button>
        <button
          type="button"
          class="min-h-touch rounded-xl bg-space-700 px-4 text-lg"
          @click="addDemoDose(600)"
        >
          ☢️ +600 µGy exposure
        </button>
      </div>
    </section>

    <section class="rounded-2xl bg-space-800 p-4">
      <h2 class="text-xl font-semibold">Mission context</h2>
      <p class="text-base text-white/70">
        A spacewalk in the last {{ EVA_RECENT_HOURS }} h makes breathing problems one level more
        serious in triage.
      </p>
      <p class="mt-2 text-lg">
        Spacewalk: {{ mission.recentEVA ? `yes, in the last ${EVA_RECENT_HOURS} h` : 'none' }}
      </p>
      <button
        type="button"
        class="mt-2 min-h-touch rounded-xl px-5 text-xl"
        :class="mission.recentEVA ? 'bg-space-700' : 'bg-blue-700'"
        @click="setRecentEVA(!mission.recentEVA)"
      >
        {{ mission.recentEVA ? '↩ Clear spacewalk' : '🧑‍🚀 A spacewalk just ended' }}
      </button>
      <p class="mt-4 text-lg">Gravity phase:</p>
      <div class="mt-2 flex flex-wrap gap-3">
        <button
          v-for="p in phases"
          :key="p.id"
          type="button"
          class="min-h-touch rounded-xl px-4 text-lg"
          :class="mission.gravityPhase === p.id ? 'bg-blue-700 font-bold' : 'bg-space-700'"
          :aria-pressed="mission.gravityPhase === p.id"
          @click="setGravityPhase(p.id)"
        >
          {{ p.label }}
        </button>
      </div>
    </section>

    <section class="rounded-2xl bg-space-800 p-4">
      <h2 class="text-xl font-semibold">Sensor scenario</h2>
      <NuxtLink
        to="/vitals"
        class="mt-3 inline-block min-h-touch rounded-xl bg-space-700 px-5 py-4 text-xl"
      >
        Go to Vitals to change it →
      </NuxtLink>
    </section>

    <section class="rounded-2xl bg-space-800 p-4">
      <h2 class="text-xl font-semibold">Reset</h2>
      <button
        type="button"
        class="mt-3 min-h-touch rounded-xl bg-sev-critical px-5 text-xl"
        @click="resetDemo"
      >
        🗑 Reset demo data
      </button>
    </section>
  </div>
</template>
