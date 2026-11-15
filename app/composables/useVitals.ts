// app/composables/useVitals.ts
import type { Scenario, VitalSample } from '~/types'

export function useVitals() {
  const scenario = useState<Scenario>('vitals-scenario', () => 'normal')
  const scenarioStartedAt = useState<number>('vitals-scenario-start', () => Date.now())
  const history = useState<VitalSample[]>('vitals-history', () => [])
  const latest = computed(() => history.value.at(-1) ?? null)

  function setScenario(s: Scenario) {
    scenario.value = s
    scenarioStartedAt.value = Date.now()
  }

  // called once per second by the monitor plugin
  function tick(): VitalSample {
    const seconds = (Date.now() - scenarioStartedAt.value) / 1000
    const sample = simulateVitals(scenario.value, seconds)
    history.value = [...history.value.slice(-299), sample] // keep the last 5 minutes
    return sample
  }

  return { scenario, history, latest, setScenario, tick }
}
