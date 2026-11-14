<!-- app/pages/emergency/guidance.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'emergency', middleware: 'emergency' })

const { state, clear } = useTriage()
const { getProtocol } = useProtocols()
const { append } = useBlackBox()
const { speak, stop } = useSpeech()

const protocol = computed(() => getProtocol(state.value.problemId ?? ''))
const result = computed(() => state.value.result)
const steps = computed(() =>
  protocol.value && result.value ? protocol.value.steps[result.value.severity] : [],
)
const done = ref<number[]>([])

function toggle(i: number) {
  done.value = done.value.includes(i) ? done.value.filter((x) => x !== i) : [...done.value, i]
}

function readAll() {
  speak(steps.value.map((s, i) => `Step ${i + 1}. ${s.text}`).join(' '))
}

async function finish() {
  stop()
  await append('TRIAGE', { ...state.value, stepsDone: done.value, endedAt: Date.now() })
  clear()
  await navigateTo('/')
}
</script>

<template>
  <div v-if="protocol && result">
    <EmergencyStepHeader :step="4" title="Do this now" />
    <EmergencySeverityBanner
      :severity="result.severity"
      :summary="protocol.summary[result.severity]"
      :reasons="result.reasons"
    />

    <button
      type="button"
      class="my-4 min-h-touch rounded-xl bg-space-700 px-4 text-xl"
      @click="readAll"
    >
      🔊 Read aloud
    </button>

    <ol class="grid gap-4">
      <EmergencyInstructionCard
        v-for="(s, i) in steps"
        :key="i"
        :number="i + 1"
        :step="s"
        :done="done.includes(i)"
        @toggle="toggle(i)"
      />
    </ol>

    <p class="mt-6 rounded-xl bg-space-800 p-4 text-xl">📡 {{ protocol.callBaseWhen }}</p>

    <div class="mt-6 grid gap-4">
      <EmergencyAlertBaseButton :severity="result.severity" :problem-id="protocol.id" />
      <UiBigButton
        label="Finish"
        icon="✅"
        variant="primary"
        hint="Save this session to the black box"
        @click="finish"
      />
    </div>

    <p class="mt-4 text-sm text-white/60">
      Protocol {{ protocol.id }} v{{ protocol.version }} · Demo content, not medical advice
    </p>
  </div>
</template>
