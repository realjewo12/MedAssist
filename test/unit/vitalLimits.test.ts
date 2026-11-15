// test/unit/vitalLimits.test.ts   (plain Vitest, no Nuxt)
import { describe, expect, it } from 'vitest'
import { VITAL_LIMITS, outOfRange, vitalLevel, type VitalKey } from '../../app/utils/vitalLimits'
import { vitalsOutOfSafeRange } from '../../app/utils/triageEngine'
import type { VitalSample } from '../../app/types'

const normal: VitalSample = { ts: 0, hr: 72, spo2: 98, rr: 14, skinTemp: 36.5, motion: 0.1 }
const L = VITAL_LIMITS

describe('outOfRange (CRITICAL limit)', () => {
  it('treats the limit itself as safe, one step past it as unsafe', () => {
    expect(outOfRange('spo2', L.spo2.critical.low)).toBe(false)
    expect(outOfRange('spo2', L.spo2.critical.low - 1)).toBe(true)
    expect(outOfRange('hr', L.hr.critical.high)).toBe(false)
    expect(outOfRange('hr', L.hr.critical.high + 1)).toBe(true)
    expect(outOfRange('hr', L.hr.critical.low - 1)).toBe(true)
  })

  it('ignores a side that has no limit', () => {
    expect(outOfRange('spo2', 100)).toBe(false) // no high limit for oxygen
    expect(outOfRange('skinTemp', 20)).toBe(false) // no low limit for temperature
  })
})

describe('vitalLevel', () => {
  it('gives OK, WARNING and CRITICAL in that order', () => {
    expect(vitalLevel('spo2', 98)).toBe('OK')
    expect(vitalLevel('spo2', L.spo2.warning.low - 1)).toBe('WARNING') // 93
    expect(vitalLevel('spo2', L.spo2.critical.low - 1)).toBe('CRITICAL') // 89
    expect(vitalLevel('hr', L.hr.warning.high + 1)).toBe('WARNING') // 121
    expect(vitalLevel('hr', L.hr.critical.low - 1)).toBe('CRITICAL') // 39
  })

  it('every WARNING limit is closer to normal than its CRITICAL limit', () => {
    for (const key of Object.keys(L) as VitalKey[]) {
      const { warning, critical } = L[key] as {
        warning: { low?: number; high?: number }
        critical: { low?: number; high?: number }
      }
      if (warning.low !== undefined && critical.low !== undefined)
        expect(warning.low, key).toBeGreaterThan(critical.low)
      if (warning.high !== undefined && critical.high !== undefined)
        expect(warning.high, key).toBeLessThan(critical.high)
    }
  })

  it('every limit says where its numbers come from', () => {
    for (const key of Object.keys(L) as VitalKey[])
      expect(L[key].source.length, key).toBeGreaterThan(10)
  })
})

describe('triage engine uses the shared CRITICAL limits', () => {
  it('flags each unsafe vital and accepts normal ones', () => {
    expect(vitalsOutOfSafeRange(normal)).toBe(false)
    expect(vitalsOutOfSafeRange({ ...normal, spo2: L.spo2.critical.low - 1 })).toBe(true)
    expect(vitalsOutOfSafeRange({ ...normal, hr: L.hr.critical.high + 1 })).toBe(true)
    expect(vitalsOutOfSafeRange({ ...normal, rr: L.rr.critical.low - 1 })).toBe(true)
  })

  it('a WARNING-level reading does not raise triage', () => {
    expect(vitalsOutOfSafeRange({ ...normal, spo2: 92 })).toBe(false)
  })

  it('does not raise triage for skin temperature', () => {
    expect(vitalsOutOfSafeRange({ ...normal, skinTemp: 40 })).toBe(false)
  })
})
