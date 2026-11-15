// app/plugins/monitor.client.ts
export default defineNuxtPlugin(() => {
  const { tick } = useVitals()
  const { tick: tickEnv, cumulativeDose } = useEnvironment()
  const { check, checkEnv } = useAlerts()
  const { append } = useBlackBox()
  let seconds = 0

  // gap analysis D-3: radiation dose adds up over a career and cannot be undone
  const saveDose = (doseRate: number) =>
    append('DOSE', { doseRate, cumulativeDose: Math.round(cumulativeDose.value * 100) / 100 })

  setInterval(() => {
    const sample = tick() // 1. read the (simulated) body sensors
    check(sample) // 2. raise alerts if needed
    const env = tickEnv() // 3. read the (simulated) habitat sensors (gap analysis C-5)
    checkEnv(env, () => saveDose(env.doseRate)) // a DOSE record on every radiation alert
    seconds++
    if (seconds % 60 === 0) {
      append('VITALS', sample) // 4. one vitals record per minute
      append('ENV', env) // and one cabin record per minute
    }
    if (seconds % 3600 === 0) saveDose(env.doseRate) // 5. one dose record per hour
  }, 1000)
})
