// app/plugins/monitor.client.ts
export default defineNuxtPlugin(() => {
  const { tick } = useVitals()
  const { check } = useAlerts()
  const { append } = useBlackBox()
  let seconds = 0

  setInterval(() => {
    const sample = tick() // 1. read the (simulated) sensors
    check(sample) // 2. raise alerts if needed
    seconds++
    if (seconds % 60 === 0) append('VITALS', sample) // 3. one vitals record per minute
  }, 1000)
})
