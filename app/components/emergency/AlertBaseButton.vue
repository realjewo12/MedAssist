<!-- app/components/emergency/AlertBaseButton.vue -->
<script setup lang="ts">
import type { Severity } from '~/types'

const props = defineProps<{ severity: Severity; problemId: string }>()
const { append } = useBlackBox()
const { online } = useSync()
const sent = ref(false)

function alertBase() {
  append('ALERT', {
    level: props.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    message: `Emergency: ${props.problemId} (${props.severity})`,
    source: 'ALERT_BASE_BUTTON',
  })
  sent.value = true
}
</script>

<template>
  <UiBigButton
    v-if="!sent"
    label="ALERT BASE"
    icon="📡"
    hint="Tell the doctor at the base"
    variant="danger"
    @click="alertBase"
  />
  <p v-else class="rounded-2xl bg-space-800 p-4 text-xl" role="status">
    📡
    {{
      online ? 'Alert sent to the base.' : 'Alert queued. It will be sent when the link is back.'
    }}
  </p>
</template>
