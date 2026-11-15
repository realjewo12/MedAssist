// app/utils/triageEngine.ts
import type { HazardId, Protocol, Severity, TriageInput, TriageResult, VitalSample } from '~/types'
import { outOfRange } from './vitalLimits' // explicit: unit tests run without Nuxt auto-imports

const LEVELS: Severity[] = ['LOW', 'MODERATE', 'CRITICAL']

/** Problems that a recent spacewalk makes more dangerous (gap analysis B-4) */
export const EVA_HAZARDS: HazardId[] = ['hypoxia', 'spacewalk', 'decompression']

const raiseOne = (s: Severity): Severity => LEVELS[LEVELS.indexOf(s) + 1] ?? 'CRITICAL'

/** Limits live in vitalLimits.ts. Skin temperature does not change the triage level. */
export function vitalsOutOfSafeRange(v: VitalSample): boolean {
  return outOfRange('spo2', v.spo2) || outOfRange('hr', v.hr) || outOfRange('rr', v.rr)
}

/**
 * Turns the chosen answers (plus live vitals and mission context, if any) into a severity.
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
    severity = raiseOne(severity)
    reasons.push('Vital signs are outside safe limits')
  }

  // 4. A recent spacewalk raises breathing / pressure problems by one (never lower it)
  if (
    input.context?.recentEVA &&
    EVA_HAZARDS.includes(protocol.hazardId) &&
    severity !== 'CRITICAL'
  ) {
    severity = raiseOne(severity)
    reasons.push('Spacewalk in the last 24 hours')
  }

  return { severity, score, redFlag, reasons }
}
