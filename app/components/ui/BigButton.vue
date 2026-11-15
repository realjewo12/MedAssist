<!-- app/components/ui/BigButton.vue -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    icon?: string
    hint?: string
    variant?: 'choice' | 'primary' | 'danger'
  }>(),
  { icon: '', hint: '', variant: 'choice' },
)

defineEmits<{ click: [] }>()

const colours = computed(
  () =>
    ({
      choice: 'bg-space-700 hover:bg-space-800 border-2 border-white/20',
      primary: 'bg-blue-700 hover:bg-blue-800',
      danger: 'bg-sev-critical hover:bg-red-800',
    })[props.variant],
)
</script>

<template>
  <button
    type="button"
    class="flex min-h-touch w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-xl font-semibold"
    :class="colours"
    @click="$emit('click')"
  >
    <span v-if="icon" class="text-4xl" aria-hidden="true">{{ icon }}</span>
    <span class="flex flex-col">
      <span>{{ label }}</span>
      <span v-if="hint" class="text-lg font-normal text-white/80">{{ hint }}</span>
    </span>
  </button>
</template>
