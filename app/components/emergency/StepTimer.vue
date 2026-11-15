<!-- app/components/emergency/StepTimer.vue -->
<script setup lang="ts">
const props = defineProps<{ seconds: number }>()

const left = ref(props.seconds)
const running = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  running.value = false
  clearInterval(timer)
}
function tick() {
  if (left.value > 0) left.value--
  if (left.value === 0) {
    stop()
    beep(1000)
    navigator.vibrate?.(500)
  }
}
function startTimer() {
  if (running.value) return
  running.value = true
  timer = setInterval(tick, 1000)
}

onBeforeUnmount(stop)

const label = computed(
  () => `${Math.floor(left.value / 60)}:${String(left.value % 60).padStart(2, '0')}`,
)
</script>

<template>
  <div class="flex items-center gap-4">
    <span class="font-mono text-4xl tabular-nums">{{ label }}</span>
    <button
      type="button"
      class="min-h-touch rounded-xl bg-blue-700 px-5 text-xl"
      @click="running ? stop() : startTimer()"
    >
      {{ running ? 'Pause' : left === seconds ? 'Start timer' : 'Resume' }}
    </button>
  </div>
</template>
