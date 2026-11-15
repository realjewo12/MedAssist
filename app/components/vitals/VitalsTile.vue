<!-- app/components/vitals/VitalsTile.vue -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{ label: string; value: number | null; unit: string; low?: number; high?: number }>(),
  { low: Number.NEGATIVE_INFINITY, high: Number.POSITIVE_INFINITY },
)

const status = computed(() => {
  if (props.value === null) return { word: 'No data', css: 'border-white/20' }
  const bad = props.value < props.low || props.value > props.high
  return bad
    ? { word: '⚠ ALERT', css: 'border-sev-critical' }
    : { word: '✔ OK', css: 'border-sev-low' }
})
</script>

<template>
  <div class="rounded-2xl border-4 bg-space-800 p-4" :class="status.css">
    <p class="text-lg text-white/80">{{ label }}</p>
    <p class="text-5xl font-bold tabular-nums">
      {{ value ?? '—' }} <span class="text-xl font-normal">{{ unit }}</span>
    </p>
    <p class="mt-1 text-lg font-semibold">{{ status.word }}</p>
  </div>
</template>
