// app/composables/useVitals.ts   STUB – Track C replaces it
import type { Scenario, VitalSample } from '~/types'

export function useVitals() {
  const scenario = useState<Scenario>('vitals-scenario', () => 'normal')
  const history = useState<VitalSample[]>('vitals-history', () => [])
  const latest = computed<VitalSample | null>(() => null)
  function setScenario(s: Scenario) {
    scenario.value = s
  }
  return { scenario, history, latest, setScenario }
}
