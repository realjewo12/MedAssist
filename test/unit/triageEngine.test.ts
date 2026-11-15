// test/unit/triageEngine.test.ts   (plain Vitest, no Nuxt)
import { describe, expect, it } from 'vitest'
import { assessSeverity } from '../../app/utils/triageEngine'
import type { Protocol, VitalSample } from '../../app/types'
import bleeding from '../../app/data/protocols/heavy-bleeding.json'

const protocol = bleeding as Protocol
const badVitals: VitalSample = { ts: 0, hr: 120, spo2: 85, rr: 26, skinTemp: 36.5, motion: 0 }

describe('assessSeverity', () => {
  it('returns CRITICAL when an answer is a red flag', () => {
    const r = assessSeverity(protocol, { answerIds: ['q1c'] })
    expect(r.severity).toBe('CRITICAL')
    expect(r.redFlag).toBe(true)
  })

  it('returns LOW for a low score', () => {
    const r = assessSeverity(protocol, { answerIds: ['q1a', 'q2a'] }) // score 1
    expect(r.severity).toBe('LOW')
  })

  it('returns MODERATE between the two thresholds', () => {
    const r = assessSeverity(protocol, { answerIds: ['q1b', 'q2a'] }) // score 3
    expect(r.severity).toBe('MODERATE')
  })

  it('raises the level by one when vitals are unsafe', () => {
    const r = assessSeverity(protocol, { answerIds: ['q1a', 'q2a'], vitals: badVitals })
    expect(r.severity).toBe('MODERATE')
    expect(r.reasons).toContain('Vital signs are outside safe limits')
  })

  it('never goes above CRITICAL', () => {
    const r = assessSeverity(protocol, { answerIds: ['q1c'], vitals: badVitals })
    expect(r.severity).toBe('CRITICAL')
  })
})
