<!-- app/components/emergency/SeverityBanner.vue -->
<script setup lang="ts">
import type { Severity } from '~/types'

const props = defineProps<{ severity: Severity; summary: string; reasons: string[] }>()

// colour + icon + word: never colour alone
const look = computed(
  () =>
    ({
      LOW: { icon: '✅', word: 'NOT SERIOUS', css: 'bg-sev-low text-white' },
      MODERATE: { icon: '⚠️', word: 'SERIOUS', css: 'bg-sev-moderate text-black' },
      CRITICAL: { icon: '🚨', word: 'CRITICAL', css: 'bg-sev-critical text-white' },
    })[props.severity],
)
</script>

<template>
  <section class="rounded-2xl p-5" :class="look.css" role="alert">
    <p class="text-3xl font-extrabold">{{ look.icon }} {{ look.word }}</p>
    <p class="mt-2 text-xl font-semibold">{{ summary }}</p>
    <p v-if="reasons.length" class="mt-2 text-lg">Why: {{ reasons.join(' · ') }}</p>
  </section>
</template>
