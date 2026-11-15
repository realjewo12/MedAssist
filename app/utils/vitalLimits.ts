// app/utils/vitalLimits.ts
// The ONE place for safe vital-sign limits. Used by the triage engine, the
// alert rules and the vitals tiles, so they always agree.
// Demo values: real limits must come from flight surgeons / NASA data.

export interface Limit {
  low?: number // below this is unsafe
  high?: number // above this is unsafe
}

export const VITAL_LIMITS = {
  hr: { low: 40, high: 140 }, // heart rate, bpm
  spo2: { low: 90 }, // blood oxygen, %
  rr: { low: 8, high: 30 }, // breaths per minute
  skinTemp: { high: 39.5 }, // °C
} satisfies Record<string, Limit>

export type VitalKey = keyof typeof VITAL_LIMITS

/** true when the value is below `low` or above `high` for that vital */
export function outOfRange(key: VitalKey, value: number): boolean {
  const limit: Limit = VITAL_LIMITS[key]
  return (
    (limit.low !== undefined && value < limit.low) ||
    (limit.high !== undefined && value > limit.high)
  )
}
