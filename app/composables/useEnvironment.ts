// app/composables/useEnvironment.ts
// Habitat sensors (gap analysis C-5), simulated in the MVP with the same scenario
// as the vitals. Also adds up the radiation dose received since the app started.
import type { EnvSample } from '~/types'

export function useEnvironment() {
  const history = useState<EnvSample[]>('env-history', () => [])
  const latest = computed(() => history.value.at(-1) ?? null)
  /** total dose since the start, in µGy (dose rate is per hour, readings every second) */
  const cumulativeDose = useState<number>('env-dose', () => 0)

  // called once per second by the monitor plugin, after useVitals().tick()
  function tick(): EnvSample {
    const { scenario, scenarioStartedAt } = useVitals()
    const seconds = (Date.now() - scenarioStartedAt.value) / 1000
    const sample = simulateEnv(scenario.value, seconds)
    const previous = latest.value
    if (previous) cumulativeDose.value += (sample.doseRate * (sample.ts - previous.ts)) / 3_600_000
    history.value = [...history.value.slice(-299), sample] // keep the last 5 minutes
    return sample
  }

  /** Demo page only: add an exposure, to show the score and dose records quickly */
  function addDemoDose(uGy: number) {
    cumulativeDose.value += uGy
  }

  function resetDose() {
    cumulativeDose.value = 0
  }

  return { history, latest, cumulativeDose, tick, addDemoDose, resetDose }
}
