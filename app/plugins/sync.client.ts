// app/plugins/sync.client.ts
// Tries to send waiting records every 5 seconds
export default defineNuxtPlugin(() => {
  const { trySync } = useSync()
  setInterval(trySync, 5000)
})