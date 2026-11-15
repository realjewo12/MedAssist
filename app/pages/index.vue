<!-- app/pages/index.vue -->
<script setup lang="ts">
const { latest } = useVitals()
const { alerts } = useAlerts()
const { lastNight, shortStreak } = useSleep()
const { cumulativeDose } = useEnvironment()

// Gap analysis D-6: the score is built from the hazards, part by part
const score = computed(() => {
  const today = new Date().toDateString()
  const todays = alerts.value.filter((a) => new Date(a.ts).toDateString() === today)
  return healthScore({
    criticalAlerts: todays.filter((a) => a.level === 'CRITICAL').length,
    warningAlerts: todays.filter((a) => a.level === 'WARNING').length,
    sleepHours: lastNight.value,
    shortSleepStreak: shortStreak.value,
    doseUGy: cumulativeDose.value,
  })
})
</script>

<template>
  <div class="grid gap-6">
    <h1 class="text-3xl font-bold">Hello, crew member</h1>

    <section class="rounded-2xl bg-space-800 p-5">
      <p class="text-lg text-white/80">Today's health score</p>
      <p class="text-5xl font-bold">
        {{ score.total }} <span class="text-2xl">/ 100 · {{ score.status }}</span>
      </p>
      <ul class="mt-4 grid gap-2">
        <li
          v-for="p in score.parts"
          :key="p.id"
          class="flex flex-wrap items-baseline justify-between gap-x-3 rounded-xl bg-space-700 px-4 py-2 text-lg"
        >
          <span>
            <strong>{{ p.label }}</strong>
            <span class="text-white/70"> · {{ p.detail }}</span>
          </span>
          <span
            class="font-bold tabular-nums"
            :class="p.penalty ? 'text-sev-moderate-text' : 'text-sev-low-text'"
          >
            {{ p.penalty ? `−${p.penalty}` : '✔ 0' }}
          </span>
        </li>
      </ul>
      <p class="mt-3 text-base text-white/70">
        Demo rule, weights not validated: 100 minus the points of each part.
      </p>
    </section>

    <!-- gap analysis C-7: a slow risk. A notice here, not an emergency banner. -->
    <section
      v-if="shortStreak"
      class="rounded-2xl border-4 border-sev-moderate bg-space-800 p-4 text-lg"
      role="status"
    >
      <p class="font-bold">
        <span class="text-sev-moderate-text">ⓘ WATCH:</span> short sleep
        {{ SHORT_NIGHTS_IN_A_ROW }} nights in a row
      </p>
      <p class="mt-1">
        Less than {{ SHORT_SLEEP_HOURS }} h each night. Plan rest and tell the flight surgeon at the
        next contact.
      </p>
    </section>

    <section class="grid grid-cols-2 gap-4">
      <VitalsTile vital="hr" :value="latest?.hr ?? null" />
      <VitalsTile vital="spo2" :value="latest?.spo2 ?? null" />
    </section>

    <p class="text-lg text-white/80">In an emergency, press the red button at the bottom right.</p>
  </div>
</template>
