<!-- app/components/emergency/StepHeader.vue -->
<script setup lang="ts">
defineProps<{ step: number; title: string }>()
const router = useRouter()
</script>

<template>
  <header class="mb-6">
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="min-h-touch rounded-xl bg-space-700 px-4 text-xl"
        @click="router.back()"
      >
        ← Back
      </button>
      <span class="text-lg text-white/80">Step {{ step }} of 4</span>
    </div>
    <h1 class="mt-4 text-3xl font-bold">{{ title }}</h1>
  </header>
</template>
