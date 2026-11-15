// app/utils/triageEngine.ts
import type { Protocol, Severity, TriageInput, TriageResult, VitalSample } from '~/types'
import { outOfRange } from './vitalLimits' // explicit: unit tests run without Nuxt auto-imports

const LEVELS: Severity[] = ['LOW', 'MODERATE', 'CRITICAL']

/** Limits live in vitalLimits.ts. Skin temperature does not change the triage level. */
export function vitalsOutOfSafeRange(v: VitalSample): boolean {
  return outOfRange('spo2', v.spo2) || outOfRange('hr', v.hr) || outOfRange('rr', v.rr)
}

/**
 * Turns the chosen answers (and live vitals, if any) into a severity.
 * Pure function: no Vue, no network, easy to test.
 */
export function assessSeverity(protocol: Protocol, input: TriageInput): TriageResult {
  let score = 0
  let redFlag = false
  const reasons: string[] = []

  // 1. Add up the score of every chosen answer
  for (const question of protocol.questions) {
    const chosen = question.answers.find((a) => input.answerIds.includes(a.id))
    if (!chosen) continue
    score += chosen.score
    if (chosen.redFlag) {
      redFlag = true
      reasons.push(chosen.label)
    }
  }

  // 2. Red flag or high score = CRITICAL, medium score = MODERATE
  let severity: Severity = 'LOW'
  if (redFlag || score >= protocol.thresholds.critical) severity = 'CRITICAL'
  else if (score >= protocol.thresholds.moderate) severity = 'MODERATE'

  // 3. Unsafe vitals raise the level by one (never lower it)
  if (input.vitals && vitalsOutOfSafeRange(input.vitals) && severity !== 'CRITICAL') {
    severity = LEVELS[LEVELS.indexOf(severity) + 1] ?? 'CRITICAL'
    reasons.push('Vital signs are outside safe limits')
  }

  return { severity, score, redFlag, reasons }
}
