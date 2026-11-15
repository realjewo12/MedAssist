// test/unit/vitalLimits.test.ts   (plain Vitest, no Nuxt)
import { describe, expect, it } from 'vitest'
import { VITAL_LIMITS, outOfRange } from '../../app/utils/vitalLimits'
import { vitalsOutOfSafeRange } from '../../app/utils/triageEngine'
import type { VitalSample } from '../../app/types'

const normal: VitalSample = { ts: 0, hr: 72, spo2: 98, rr: 14, skinTemp: 36.5, motion: 0.1 }

describe('outOfRange', () => {
  it('treats the limit itself as safe, one step past it as unsafe', () => {
    expect(outOfRange('spo2', VITAL_LIMITS.spo2.low)).toBe(false)
    expect(outOfRange('spo2', VITAL_LIMITS.spo2.low - 1)).toBe(true)
    expect(outOfRange('hr', VITAL_LIMITS.hr.high)).toBe(false)
    expect(outOfRange('hr', VITAL_LIMITS.hr.high + 1)).toBe(true)
    expect(outOfRange('hr', VITAL_LIMITS.hr.low - 1)).toBe(true)
  })

  it('ignores a side that has no limit', () => {
    expect(outOfRange('spo2', 100)).toBe(false) // no high limit for oxygen
    expect(outOfRange('skinTemp', 20)).toBe(false) // no low limit for temperature
  })
})

describe('triage engine uses the shared limits', () => {
  it('flags each unsafe vital and accepts normal ones', () => {
    expect(vitalsOutOfSafeRange(normal)).toBe(false)
    expect(vitalsOutOfSafeRange({ ...normal, spo2: VITAL_LIMITS.spo2.low - 1 })).toBe(true)
    expect(vitalsOutOfSafeRange({ ...normal, hr: VITAL_LIMITS.hr.high + 1 })).toBe(true)
    expect(vitalsOutOfSafeRange({ ...normal, rr: VITAL_LIMITS.rr.low - 1 })).toBe(true)
  })

  it('does not raise triage for skin temperature', () => {
    expect(vitalsOutOfSafeRange({ ...normal, skinTemp: 40 })).toBe(false)
  })
})
