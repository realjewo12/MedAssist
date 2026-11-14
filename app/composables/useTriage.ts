// app/composables/useTriage.ts
import type { Target, TriageResult } from '~/types'

interface TriageState {
  sessionId: string | null
  startedAt: number | null
  problemId: string | null
  target: Target | null
  answerIds: string[]
  result: TriageResult | null
}

const empty = (): TriageState => ({
  sessionId: null,
  startedAt: null,
  problemId: null,
  target: null,
  answerIds: [],
  result: null,
})

export function useTriage() {
  // useState = state shared by every page and component
  const state = useState<TriageState>('triage', empty)

  function start(problemId: string | null = null) {
    state.value = { ...empty(), sessionId: newId(), startedAt: Date.now(), problemId }
  }
  function selectProblem(id: string) {
    state.value.problemId = id
    state.value.answerIds = []
    state.value.result = null
  }
  function selectTarget(target: Target) {
    state.value.target = target
  }
  // keeps the answers before this question, so going back works
  function answer(index: number, answerId: string) {
    state.value.answerIds = [...state.value.answerIds.slice(0, index), answerId]
  }
  function setResult(result: TriageResult) {
    state.value.result = result
  }
  function clear() {
    state.value = empty()
  }

  return { state, start, selectProblem, selectTarget, answer, setResult, clear }
}
