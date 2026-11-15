<!-- app/components/ui/StatusBar.vue -->
<script setup lang="ts">
const { online, pendingCount } = useSync()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => (now.value = new Date()), 1000)))
onBeforeUnmount(() => clearInterval(timer))

const time = computed(() => now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

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
      <span :class="online ? 'text-green-400' : 'text-amber-400'" role="status">
        {{ online ? '● Base connected' : `○ Base offline · ${pendingCount} waiting` }}
      </span>
    </div>
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
