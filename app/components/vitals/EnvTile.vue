<!-- app/components/vitals/EnvTile.vue   habitat sensor tile (gap analysis C-5) -->
<script setup lang="ts">
import type { EnvKey } from '~/utils/envLimits'

const props = defineProps<{ sensor: EnvKey; value: number | null }>()

const limit = computed(() => ENV_LIMITS[props.sensor])

// colour + icon + word: never colour alone
const status = computed(() => {
  if (props.value === null) return { word: 'No data', css: 'border-white/20' }
  return {
    OK: { word: '✔ OK', css: 'border-sev-low' },
    WARNING: { word: 'ⓘ WATCH', css: 'border-sev-moderate' },
    CRITICAL: { word: '⚠ ALERT', css: 'border-sev-critical' },
  }[envLevel(props.sensor, props.value)]
})
</script>

<template>
  <div class="rounded-2xl border-4 bg-space-800 p-4" :class="status.css">
    <p class="text-lg text-white/80">{{ limit.label }}</p>
    <p class="text-4xl font-bold tabular-nums">
      {{ value ?? '—' }} <span class="text-lg font-normal">{{ limit.unit }}</span>
    </p>
    <p class="mt-1 text-lg font-semibold">{{ status.word }}</p>
  </div>
</template>
