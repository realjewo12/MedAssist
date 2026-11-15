<!-- app/pages/emergency/severity.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'emergency', middleware: 'emergency' })

const { state, answer, setResult } = useTriage()
const { getProtocol } = useProtocols()
const { latest } = useVitals()

const protocol = computed(() => getProtocol(state.value.problemId ?? ''))
const index = ref(0) // which question we are on
const question = computed(() => protocol.value?.questions[index.value])

async function choose(answerId: string, redFlag?: boolean) {
  if (!protocol.value) return
  answer(index.value, answerId)
  const isLast = index.value >= protocol.value.questions.length - 1

  if (redFlag || isLast) {
    // In the MVP the simulator stands for the person in distress
    const result = assessSeverity(protocol.value, {
      answerIds: state.value.answerIds,
      vitals: latest.value ?? undefined,
    })
    setResult(result)
    await navigateTo('/emergency/guidance')
  } else {
    index.value++
  }
}
</script>

<template>
  <div v-if="protocol && question">
    <EmergencyStepHeader :step="3" title="How serious is it?" />
    <p class="mb-2 text-lg text-white/80">
      Question {{ index + 1 }} of {{ protocol.questions.length }}
    </p>
    <h2 class="mb-6 text-2xl font-semibold">{{ question.text }}</h2>
    <div class="grid gap-4">
      <UiBigButton
        v-for="a in question.answers"
        :key="a.id"
        :label="a.label"
        @click="choose(a.id, a.redFlag)"
      />
    </div>
    <button
      v-if="index > 0"
      type="button"
      class="mt-6 min-h-touch text-xl underline"
      @click="index--"
    >
      ← Previous question
    </button>
  </div>
  <p v-else class="text-xl">Loading questions… (if this stays, the protocol file is missing)</p>
</template>
