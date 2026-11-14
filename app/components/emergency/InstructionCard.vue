<!-- app/components/emergency/InstructionCard.vue -->
<script setup lang="ts">
import type { ProtocolStep } from '~/types'

defineProps<{ number: number; step: ProtocolStep; done: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <li class="rounded-2xl bg-space-800 p-4" :class="done ? 'opacity-60' : ''">
    <div class="flex items-start gap-4">
      <span
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-space-900"
      >
        {{ number }}
      </span>
      <p class="flex-1 text-2xl font-semibold">{{ step.text }}</p>
    </div>
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
