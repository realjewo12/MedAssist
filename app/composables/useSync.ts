// app/composables/useSync.ts   STUB – Track D replaces it
export function useSync() {
  const online = useState<boolean>('sync-online', () => true)
  const pendingCount = computed(() => 0)
  function setOnline(value: boolean) {
    online.value = value
  }
  return { online, pendingCount, setOnline }
}
