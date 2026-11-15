// app/composables/useMission.ts
// Mission context (gap analysis B-4): set from the Demo page in the MVP.
// In a real mission it would come from the mission timeline.
import type { GravityPhase, MissionContext } from '~/types'

export const EVA_RECENT_HOURS = 24 // "a spacewalk in the last 24 hours" (gap analysis B-2)
const STORAGE_KEY = 'medassist-mission'

interface MissionState {
  evaEndedAt: number | null // when the last spacewalk ended
  gravityPhase: GravityPhase
}

const DEFAULT: MissionState = { evaEndedAt: null, gravityPhase: 'micro' }

function load(): MissionState {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return { ...DEFAULT }
  }
}

export function useMission() {
  const state = useState<MissionState>('mission', load)

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
    } catch {
      // not saved: the context still works until the app is closed
    }
  }

  /** Recomputed when read: a spacewalk stops being "recent" after 24 h */
  const context = computed<MissionContext>(() => ({
    recentEVA:
      state.value.evaEndedAt !== null &&
      Date.now() - state.value.evaEndedAt < EVA_RECENT_HOURS * 3600 * 1000,
    gravityPhase: state.value.gravityPhase,
  }))

  /** true: a spacewalk just ended. false: no recent spacewalk. */
  function setRecentEVA(value: boolean) {
    state.value = { ...state.value, evaEndedAt: value ? Date.now() : null }
    save()
  }

  function setGravityPhase(phase: GravityPhase) {
    state.value = { ...state.value, gravityPhase: phase }
    save()
  }

  return { context, setRecentEVA, setGravityPhase }
}
