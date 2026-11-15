// app/composables/useProtocols.ts
import type { Problem, Protocol } from '~/types'
import problemsData from '~/data/problems.json'

// Every JSON file in data/protocols/ is bundled into the app: no network needed,
// and a new protocol only needs its file + an entry in problems.json.
const files = import.meta.glob<Protocol>('~/data/protocols/*.json', {
  eager: true,
  import: 'default',
})
const PROTOCOLS: Record<string, Protocol> = Object.fromEntries(
  Object.values(files).map((p) => [p.id, p]),
)

export function useProtocols() {
  const problems = problemsData as Problem[]
  function getProtocol(id: string): Protocol | undefined {
    return PROTOCOLS[id]
  }
  /** Crew-wide problems (e.g. radiation) skip "Who needs help?" (gap analysis B-7) */
  function isCrewWide(id: string): boolean {
    return PROTOCOLS[id]?.crewWide === true
  }
  return { problems, getProtocol, isCrewWide }
}
