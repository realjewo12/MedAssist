<!-- app/components/vitals/VitalsTile.vue -->
<script setup lang="ts">
import type { VitalKey } from '~/utils/vitalLimits'

const props = defineProps<{ vital: VitalKey; value: number | null }>()

const limit = computed(() => VITAL_LIMITS[props.vital])

// colour + icon + word: never colour alone
const status = computed(() => {
  if (props.value === null) return { word: 'No data', css: 'border-white/20' }
  return {
    OK: { word: '✔ OK', css: 'border-sev-low' },
    WARNING: { word: 'ⓘ WATCH', css: 'border-sev-moderate' },
    CRITICAL: { word: '⚠ ALERT', css: 'border-sev-critical' },
  }[vitalLevel(props.vital, props.value)]
})
</script>

<template>
  <div class="rounded-2xl border-4 bg-space-800 p-4" :class="status.css">
    <p class="text-lg text-white/80">{{ limit.label }}</p>
    <p class="text-5xl font-bold tabular-nums">
      {{ value ?? '—' }} <span class="text-xl font-normal">{{ limit.unit }}</span>
    </p>
    <p class="mt-1 text-lg font-semibold">{{ status.word }}</p>
  </div>
</template>
