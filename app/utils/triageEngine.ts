// app/utils/triageEngine.ts   STUB – Track B replaces it
import type { Protocol, TriageInput, TriageResult } from '~/types'

export function assessSeverity(_protocol: Protocol, _input: TriageInput): TriageResult {
  return { severity: 'LOW', score: 0, redFlag: false, reasons: [] }
}
