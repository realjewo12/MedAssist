<!-- app/components/emergency/InstructionCard.vue -->
<script setup lang="ts">
import type { ProtocolStep } from '~/types'

defineProps<{ number: number; step: ProtocolStep; done: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <li class="rounded-2xl bg-space-800 p-4" :class="done ? 'opacity-60' : ''">
    <!-- the number sits above the text so the text gets the full width (2 lines on a phone) -->
    <span
      class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-space-900"
      aria-hidden="true"
    >
      {{ number }}
    </span>
    <p class="text-step font-semibold">
      <span class="sr-only">Step {{ number }}: </span>{{ step.text }}
    </p>
    <EmergencyStepTimer v-if="step.timerSeconds" class="mt-4" :seconds="step.timerSeconds" />
    <button
      type="button"
      class="mt-4 min-h-touch w-full rounded-xl border-2 border-white/30 text-xl"
      @click="$emit('toggle')"
    >
      {{ done ? '✔ Done' : 'Mark as done' }}
    </button>
  </li>
</template>
