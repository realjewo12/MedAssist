<!-- app/pages/demo.vue -->
<script setup lang="ts">
const { online, setOnline, pendingCount } = useSync()
const { clearAll } = useBlackBox()
const { reset: resetAlerts } = useAlerts()
const { setScenario } = useVitals()

function resetDemo() {
  if (!confirm('Delete all black box records and alerts?')) return
  clearAll()
  resetAlerts()
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
