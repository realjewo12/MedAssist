// app/utils/vitalLimits.ts
// The ONE place for vital-sign limits. Used by the triage engine, the alert
// rules and the vitals tiles, so they always agree.
// None of the NASA/CSA sources publish numeric limits (gap analysis B-6):
// every value here is a team demo value that needs flight-surgeon approval.

export interface Range {
  low?: number // below this
  high?: number // above this
}

export interface VitalLimit {
  label: string
  unit: string
  warning: Range // early notice: amber, no sound
  critical: Range // alarm: red, beep, raises triage
  source: string // where the numbers come from
}

const DEMO = 'Team demo value (Earth clinical practice); needs flight-surgeon approval'

export const VITAL_LIMITS = {
  hr: {
    label: 'Heart rate',
    unit: 'bpm',
    warning: { high: 120 }, // fixed until a personal baseline exists (C-2)
    critical: { low: 40, high: 140 },
    source: DEMO,
  },
  spo2: {
    label: 'Oxygen (SpO2)',
    unit: '%',
    warning: { low: 94 },
    critical: { low: 90 },
    source: DEMO,
  },
  rr: {
    label: 'Breathing',
    unit: '/min',
    warning: { high: 24 },
    critical: { low: 8, high: 30 },
    source: DEMO,
  },
  skinTemp: {
    label: 'Skin temperature', // a wrist/chest sensor reads skin, not core temperature
    unit: '°C',
    warning: { high: 38 },
    critical: { high: 39.5 },
    source: DEMO,
  },
} satisfies Record<string, VitalLimit>

export type VitalKey = keyof typeof VITAL_LIMITS
export type VitalLevel = 'OK' | 'WARNING' | 'CRITICAL'

const outside = (r: Range, value: number) =>
  (r.low !== undefined && value < r.low) || (r.high !== undefined && value > r.high)

/** true when the value is past the CRITICAL limit for that vital */
export function outOfRange(key: VitalKey, value: number): boolean {
  return outside(VITAL_LIMITS[key].critical, value)
}

/** OK, WARNING or CRITICAL for one reading */
export function vitalLevel(key: VitalKey, value: number): VitalLevel {
  const limit: VitalLimit = VITAL_LIMITS[key]
  if (outside(limit.critical, value)) return 'CRITICAL'
  if (outside(limit.warning, value)) return 'WARNING'
  return 'OK'
}
