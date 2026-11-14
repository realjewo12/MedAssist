<!-- app/layouts/default.vue -->
<template>
  <div class="min-h-screen bg-space-900 text-white">
    <UiStatusBar />
    <UiAlertBanner />
    <main class="mx-auto max-w-3xl p-4 pb-32">
      <slot />
    </main>
    <UiEmergencyButton />
  </div>
</template>
