// app/utils/envLimits.ts
// Cabin and radiation limits (gap analysis C-5). The NASA/CSA sources name these
// hazards but give no numbers: every value is a team demo value pending validation.
// (no comma on an 'export const' line: Nuxt's auto-import scanner misreads it)
import type { EnvSample } from '~/types'
import type { Range, VitalLevel } from './vitalLimits'

export interface EnvLimit {
  label: string
  unit: string
  warning: Range
  critical: Range
  source: string
}

const PENDING = 'Team demo value; no number in the NASA/CSA sources; pending validation'

export const ENV_LIMITS = {
  pCO2: {
    label: 'Cabin CO2',
    unit: 'mmHg',
    warning: { high: 4 },
    critical: { high: 8 },
    source: PENDING,
  },
  doseRate: {
    label: 'Radiation dose rate',
    unit: 'µGy/h',
    warning: { high: 50 }, // normal orbit background is far lower
    critical: { high: 200 }, // e.g. a solar particle event
    source: PENDING,
  },
} satisfies Record<string, EnvLimit>

export type EnvKey = keyof typeof ENV_LIMITS

const outside = (r: Range, value: number) =>
  (r.low !== undefined && value < r.low) || (r.high !== undefined && value > r.high)

/** OK, WARNING or CRITICAL for one habitat reading */
export function envLevel(key: EnvKey, value: number): VitalLevel {
  const limit: EnvLimit = ENV_LIMITS[key]
  if (outside(limit.critical, value)) return 'CRITICAL'
  if (outside(limit.warning, value)) return 'WARNING'
  return 'OK'
}

/** The value of one habitat key in a sample */
export const envValue = (e: EnvSample, key: EnvKey) => e[key]
