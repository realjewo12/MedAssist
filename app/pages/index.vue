<!-- app/pages/index.vue -->
<script setup lang="ts">
const { latest } = useVitals()
const { alerts } = useAlerts()

// Demo daily score: 100 minus 25 for each alert today
const score = computed(() => {
  const today = new Date().toDateString()
  const count = alerts.value.filter((a) => new Date(a.ts).toDateString() === today).length
  return Math.max(0, 100 - count * 25)
})
const status = computed(() =>
  score.value >= 80 ? 'Good' : score.value >= 60 ? 'Watch' : 'Concern',
)
</script>

<template>
  <div class="grid gap-6">
    <h1 class="text-3xl font-bold">Hello, crew member</h1>

    <section class="rounded-2xl bg-space-800 p-5">
      <p class="text-lg text-white/80">Today's health score</p>
      <p class="text-5xl font-bold">
        {{ score }} <span class="text-2xl">/ 100 · {{ status }}</span>
      </p>
      <p class="mt-2 text-base text-white/70">Demo rule: 100 minus 25 for each alert today.</p>
    </section>

    <section class="grid grid-cols-2 gap-4">
      <VitalsTile vital="hr" :value="latest?.hr ?? null" />
      <VitalsTile vital="spo2" :value="latest?.spo2 ?? null" />
    </section>

    <p class="text-lg text-white/80">In an emergency, press the red button at the bottom right.</p>
  </div>
</template>
