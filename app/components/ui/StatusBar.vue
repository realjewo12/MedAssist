<!-- app/components/ui/StatusBar.vue -->
<script setup lang="ts">
const { online, pendingCount } = useSync()
const { saveError } = useBlackBox()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => (now.value = new Date()), 1000)))
onBeforeUnmount(() => clearInterval(timer))

const time = computed(() =>
  now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
)

const links = [
  { to: '/', label: 'Home' },
  { to: '/vitals', label: 'Vitals' },
  { to: '/blackbox', label: 'Black box' },
  { to: '/demo', label: 'Demo' },
]
</script>

<template>
  <header class="bg-space-800 px-4 py-2">
    <div class="flex flex-wrap items-center justify-between gap-2 text-lg">
      <span class="font-bold">🩺 MedAssist</span>
      <span class="tabular-nums">{{ time }}</span>
      <span :class="online ? 'text-sev-low-text' : 'text-sev-moderate-text'" role="status">
        {{ online ? '● Base connected' : `○ Base offline · ${pendingCount} waiting` }}
      </span>
    </div>
    <NuxtLink
      v-if="saveError"
      to="/blackbox"
      class="mt-2 block rounded-lg bg-sev-critical px-3 py-2 text-lg font-bold"
      role="alert"
    >
      ⚠ Black box not saving ({{ saveError.reason }}). Tap for details.
    </NuxtLink>
    <nav class="mt-2 flex flex-wrap gap-2">
      <NuxtLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="rounded-lg px-3 py-2 text-lg hover:bg-space-700"
        active-class="bg-space-700 font-bold"
      >
        {{ l.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
