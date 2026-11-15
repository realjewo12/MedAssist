<!-- app/pages/emergency/problem.vue   step 2: what is the problem? -->
<script setup lang="ts">
definePageMeta({ layout: 'emergency', middleware: 'emergency' })

const { problems, isCrewWide } = useProtocols()
const { state, selectProblem, selectTarget } = useTriage()

// someone answering for themselves is responding: hide "Not responding"
const shown = computed(() =>
  state.value.target === 'SELF' ? problems.filter((p) => !p.notForSelf) : problems,
)

async function choose(id: string) {
  selectProblem(id)
  if (isCrewWide(id)) selectTarget('CREW') // e.g. radiation: everyone is affected
  await navigateTo('/emergency/severity')
}
</script>

<template>
  <div>
    <EmergencyStepHeader :step="2" title="What is the problem?" />
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UiBigButton
        v-for="p in shown"
        :key="p.id"
        :label="p.label"
        :icon="p.icon"
        @click="choose(p.id)"
      />
    </div>
  </div>
</template>
