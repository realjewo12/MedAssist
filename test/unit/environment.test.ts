// test/unit/environment.test.ts   (plain Vitest, no Nuxt) — gap analysis C-5, B-7
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ENV_LIMITS, envLevel } from '../../app/utils/envLimits'
import { simulateEnv } from '../../app/utils/vitalsSimulator'
import { assessSeverity } from '../../app/utils/triageEngine'
import type { Protocol } from '../../app/types'
import radiation from '../../app/data/protocols/radiation-alert.json'

afterEach(() => vi.restoreAllMocks())

describe('habitat limits', () => {
  it('cabin CO2: OK, WARNING above 4 mmHg, CRITICAL above 8', () => {
    expect(envLevel('pCO2', 2.5)).toBe('OK')
    expect(envLevel('pCO2', 4.5)).toBe('WARNING')
    expect(envLevel('pCO2', 8.5)).toBe('CRITICAL')
  })

  it('dose rate: WARNING above 50 µGy/h, CRITICAL above 200', () => {
    expect(envLevel('doseRate', 15)).toBe('OK')
    expect(envLevel('doseRate', 60)).toBe('WARNING')
    expect(envLevel('doseRate', 250)).toBe('CRITICAL')
  })

  it('every limit says where its numbers come from', () => {
    for (const l of Object.values(ENV_LIMITS)) expect(l.source).toContain('pending validation')
  })
})

describe('simulateEnv', () => {
  it('normal cabin stays OK; the two scenarios cross their limits', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // no noise
    expect(envLevel('pCO2', simulateEnv('normal', 300).pCO2)).toBe('OK')
    expect(envLevel('doseRate', simulateEnv('normal', 300).doseRate)).toBe('OK')
    expect(envLevel('pCO2', simulateEnv('co2-buildup', 20).pCO2)).toBe('WARNING')
    expect(envLevel('pCO2', simulateEnv('co2-buildup', 60).pCO2)).toBe('CRITICAL')
    expect(envLevel('doseRate', simulateEnv('solar-event', 10).doseRate)).toBe('WARNING')
    expect(envLevel('doseRate', simulateEnv('solar-event', 30).doseRate)).toBe('CRITICAL')
  })
})

describe('radiation alert protocol (gap analysis B-7)', () => {
  const p = radiation as Protocol
  const sev = (answerIds: string[]) => assessSeverity(p, { answerIds }).severity

  it('is crew-wide and linked to the radiation risk', () => {
    expect(p.crewWide).toBe(true)
    expect(p.hazardId).toBe('radiation')
  })

  it('alarm stopped and everyone shielded → LOW', () => {
    expect(sev(['q1a', 'q2a', 'q3a'])).toBe('LOW')
  })

  it('alarm still on → MODERATE; and someone outside → CRITICAL', () => {
    expect(sev(['q1b', 'q2a', 'q3a'])).toBe('MODERATE')
    expect(sev(['q1b', 'q2b', 'q3a'])).toBe('CRITICAL')
  })

  it('anyone sick or vomiting → CRITICAL', () => {
    expect(sev(['q1a', 'q2a', 'q3b'])).toBe('CRITICAL')
  })
})
