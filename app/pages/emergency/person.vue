<!-- app/pages/emergency/person.vue -->
<script setup lang="ts">
import type { Target } from '~/types'

definePageMeta({ layout: 'emergency', middleware: 'emergency' })

const { selectTarget } = useTriage()

async function choose(target: Target) {
  selectTarget(target)
  await navigateTo('/emergency/severity')
}
</script>

<template>
  <div>
    <EmergencyStepHeader :step="2" title="Who needs help?" />
    <div class="grid gap-4">
      <UiBigButton label="ME" icon="🙋" hint="I am the one in trouble" @click="choose('SELF')" />
      <UiBigButton
        label="MY TEAMMATE"
        icon="🧑‍🚀"
        hint="Someone else needs help"
        @click="choose('TEAMMATE')"
      />
    </div>
  </div>
</template>
