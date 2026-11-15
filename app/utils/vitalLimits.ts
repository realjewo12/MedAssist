// app/utils/vitalLimits.ts
// The ONE place for vital-sign limits. Used by the triage engine, the alert
// rules and the vitals tiles, so they always agree.
// None of the NASA/CSA sources publish numeric limits (gap analysis B-6):
// every value here is a team demo value that needs flight-surgeon approval.

import type { GravityPhase } from '~/types'

export interface Range {
  low?: number // below this
  high?: number // above this
}

export interface VitalLimit {
  label: string
  unit: string
  warning: Range // early notice: amber, no sound
  critical: Range // alarm: red, beep, raises triage
  // gap analysis C-2: once the person's normal value is known, the WARNING
  // limit is relative to it instead of the fixed `warning` value above
  baselineWarning?: { abovePercent?: number; aboveBy?: number }
  source: string // where the numbers come from
}

const DEMO = 'Team demo value (Earth clinical practice); needs flight-surgeon approval'

export const VITAL_LIMITS = {
  hr: {
    label: 'Heart rate',
    unit: 'bpm',
    warning: { high: 120 }, // until a personal baseline exists
    critical: { low: 40, high: 140 },
    baselineWarning: { abovePercent: 20 }, // 20 % above the person's normal
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
    warning: { high: 38 }, // until a personal baseline exists
    critical: { high: 39.5 },
    baselineWarning: { aboveBy: 1 }, // 1 °C above the person's normal
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

/** The WARNING range in use: relative to the person's baseline when known */
export function warningRange(key: VitalKey, baseline?: number | null): Range {
  const limit: VitalLimit = VITAL_LIMITS[key]
  const rel = limit.baselineWarning
  if (baseline == null || !rel) return limit.warning
  const high = rel.abovePercent !== undefined ? baseline * (1 + rel.abovePercent / 100) : undefined
  return { ...limit.warning, high: rel.aboveBy !== undefined ? baseline + rel.aboveBy : high }
}

/** OK, WARNING or CRITICAL for one reading (CRITICAL limits never depend on the baseline) */
export function vitalLevel(key: VitalKey, value: number, baseline?: number | null): VitalLevel {
  if (outside(VITAL_LIMITS[key].critical, value)) return 'CRITICAL'
  if (outside(warningRange(key, baseline), value)) return 'WARNING'
  return 'OK'
}

// Impact rule by gravity phase (gap analysis C-3). The old rule (3 g, then 15 s
// still) assumed Earth gravity. Team demo values; need validation.
export interface ImpactRule {
  shockG: number // a movement spike above this counts as an impact
  needsVitalChange?: boolean // micro-g: floating still looks like being unconscious
}

// (no comma on an 'export const' line: Nuxt's auto-import scanner misreads it)
export const IMPACT_LIMITS = {
  micro: { shockG: 2, needsVitalChange: true }, // a collision; stillness alone is normal
  lunar: { shockG: 2 }, // 1/6 g: falls are slower and softer
  mars: { shockG: 2.5 }, // 3/8 g
  landing: { shockG: 5 }, // touchdown loads are high: avoid false alarms
} satisfies Record<GravityPhase, ImpactRule>

/** In micro-g, an impact counts only if heart or breathing rate then changes this much */
export const IMPACT_VITAL_CHANGE = {
  hr: 20,
  rr: 6,
}

export const IMPACT_SOURCE =
  'Team demo values scaled from the Earth 3 g rule; need validation by flight surgeons'
