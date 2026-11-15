<!-- app/pages/emergency/guidance.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'emergency', middleware: 'emergency' })

const { state, clear } = useTriage()
const { getProtocol } = useProtocols()
const { append } = useBlackBox()
const { speak, stop } = useSpeech()

// "Sit upright." instead of "Sit them upright." when the person chose ME
const protocol = computed(() => {
  const p = getProtocol(state.value.problemId ?? '')
  return p ? personalize(p, state.value.target) : undefined
})
const result = computed(() => state.value.result)
const steps = computed(() =>
  protocol.value && result.value ? protocol.value.steps[result.value.severity] : [],
)
const done = ref<number[]>([])

// Live check: are the vitals back in the safe range?
const { latest } = useVitals()
const { context: mission } = useMission()
const { open } = useAlerts()
const vitalsStable = computed<boolean | null>(() =>
  latest.value ? !vitalsOutOfSafeRange(latest.value) && open.value.length === 0 : null,
)

function toggle(i: number) {
  done.value = done.value.includes(i) ? done.value.filter((x) => x !== i) : [...done.value, i]
}

function readAll() {
  speak(steps.value.map((s, i) => `Step ${i + 1}. ${s.text}`).join(' '))
}

async function finish() {
  stop()
  await append('TRIAGE', {
    ...state.value,
    stepsDone: done.value,
    endedAt: Date.now(),
    vitalsStableAtEnd: vitalsStable.value, // null = no sensor data
    mission: mission.value, // spacewalk / gravity phase at the time (gap analysis D-3)
  })
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

    <section
      v-if="vitalsStable !== null"
      class="mt-6 rounded-xl p-4 text-xl"
      :class="vitalsStable ? 'bg-sev-low text-white' : 'bg-sev-moderate text-space-900'"
      role="status"
    >
      <template v-if="vitalsStable">
        ✅ <strong>Vitals in the safe range.</strong> Keep resting. The monitor keeps watching.
      </template>
      <template v-else>
        ⚠️ <strong>Not stable yet.</strong> Keep following the steps and watch the vitals. If the
        vitals do not improve, press ALERT BASE.
      </template>
    </section>

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

    <p class="mt-4 text-lg text-white/60">
      Protocol {{ protocol.id }} v{{ protocol.version }} · Demo content, not medical advice
    </p>
  </div>
</template>
