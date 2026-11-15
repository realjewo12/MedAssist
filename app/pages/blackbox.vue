<!-- app/pages/blackbox.vue -->
<script setup lang="ts">
const { records, verify, exportJson } = useBlackBox()
const { lastBatch, lastSyncAt } = useSync()

const integrity = ref<{ ok: boolean; brokenAtSeq?: number } | null>(null)
async function check() {
  integrity.value = await verify()
}
onMounted(check)
watch(() => records.value.length, check)

const newestFirst = computed(() => [...records.value].reverse().slice(0, 100))
const fmt = (ts: number) => new Date(ts).toLocaleString()
const short = (data: unknown) => JSON.stringify(data).slice(0, 140)
</script>

<template>
  <div>
    <h1 class="mb-4 text-3xl font-bold">Black box</h1>

    <section
      class="rounded-2xl p-4 text-xl font-bold"
      :class="integrity?.ok === false ? 'bg-sev-critical' : 'bg-sev-low'"
      role="status"
    >
      <template v-if="!integrity">Checking…</template>
      <template v-else-if="integrity.ok">🔒 Chain verified · {{ records.length }} records</template>
      <template v-else>⚠ Chain broken at record {{ integrity.brokenAtSeq }} (data was changed)</template>
    </section>

    <div class="mt-4 flex flex-wrap gap-3">
      <button type="button" class="min-h-touch rounded-xl bg-space-700 px-5 text-xl" @click="check">🔍 Verify again</button>
      <button type="button" class="min-h-touch rounded-xl bg-blue-700 px-5 text-xl" @click="exportJson">⬇ Export JSON</button>
    </div>

    <p v-if="lastSyncAt" class="mt-4 text-lg text-white/80">
      Last sync {{ fmt(lastSyncAt) }}, in this order: {{ lastBatch.join(' → ') }}
    </p>

    <ul class="mt-6 grid gap-3">
      <li v-for="r in newestFirst" :key="r.seq" class="rounded-xl bg-space-800 p-3">
        <p class="text-lg font-semibold">
          #{{ r.seq }} · {{ r.kind }} · {{ fmt(r.ts) }}
          <span :class="r.synced ? 'text-green-400' : 'text-amber-400'">{{ r.synced ? '✔ synced' : '⏳ waiting' }}</span>
        </p>
        <p class="break-all font-mono text-sm text-white/70">{{ short(r.data) }}</p>
        <p class="font-mono text-xs text-white/50">hash {{ r.hash.slice(0, 16) }}…</p>
      </li>
    </ul>
    <p v-if="records.length === 0" class="mt-6 text-xl">No records yet.</p>
  </div>
</template>
