// app/composables/useVitals.ts
import type { Scenario, VitalSample } from '~/types'
import type { VitalKey } from '~/utils/vitalLimits'

// gap analysis C-2: a personal baseline from the last stable period
export const BASELINE_MIN_SAMPLES = 60 // about 1 minute of safe readings before it is used

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

const VITALS: VitalKey[] = ['hr', 'spo2', 'rr', 'skinTemp']

export function useVitals() {
  const scenario = useState<Scenario>('vitals-scenario', () => 'normal')
  const scenarioStartedAt = useState<number>('vitals-scenario-start', () => Date.now())
  const history = useState<VitalSample[]>('vitals-history', () => [])
  const latest = computed(() => history.value.at(-1) ?? null)

  /**
   * The person's normal values: median of the last 5 minutes of readings that were
   * all inside the FIXED limits (so the baseline never learns from a problem).
   * null until there are BASELINE_MIN_SAMPLES such readings.
   */
  const baseline = computed<Record<VitalKey, number> | null>(() => {
    const stable = history.value.filter((v) => VITALS.every((k) => vitalLevel(k, v[k]) === 'OK'))
    if (stable.length < BASELINE_MIN_SAMPLES) return null
    return Object.fromEntries(VITALS.map((k) => [k, median(stable.map((v) => v[k]))])) as Record<
      VitalKey,
      number
    >
  })

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

  return { scenario, history, latest, baseline, setScenario, tick }
}
