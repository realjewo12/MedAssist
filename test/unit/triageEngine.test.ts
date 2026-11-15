// test/unit/triageEngine.test.ts   (plain Vitest, no Nuxt)
import { describe, expect, it } from 'vitest'
import { assessSeverity } from '../../app/utils/triageEngine'
import type { MissionContext, Protocol, VitalSample } from '../../app/types'
import bleeding from '../../app/data/protocols/heavy-bleeding.json'
import hardToBreathe from '../../app/data/protocols/hard-to-breathe.json'

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

describe('assessSeverity with mission context (gap analysis B-4)', () => {
  const breathing = hardToBreathe as Protocol // hazardId: hypoxia
  const afterEVA: MissionContext = { recentEVA: true, gravityPhase: 'micro' }
  const noEVA: MissionContext = { recentEVA: false, gravityPhase: 'micro' }
  const safeAnswers = ['q1a', 'q2a', 'q3a'] // score 0 → LOW

  it('a recent spacewalk raises a breathing problem by one level', () => {
    expect(assessSeverity(breathing, { answerIds: safeAnswers, context: noEVA }).severity).toBe(
      'LOW',
    )
    const r = assessSeverity(breathing, { answerIds: safeAnswers, context: afterEVA })
    expect(r.severity).toBe('MODERATE')
    expect(r.reasons).toContain('Spacewalk in the last 24 hours')
  })

  it('does not change a problem that is not linked to spacewalks', () => {
    const r = assessSeverity(protocol, { answerIds: ['q1a', 'q2a'], context: afterEVA }) // bleeding
    expect(r.severity).toBe('LOW')
    expect(r.reasons).not.toContain('Spacewalk in the last 24 hours')
  })

  it('vitals and a spacewalk together raise LOW to CRITICAL', () => {
    const r = assessSeverity(breathing, {
      answerIds: safeAnswers,
      vitals: badVitals,
      context: afterEVA,
    })
    expect(r.severity).toBe('CRITICAL')
    expect(r.reasons).toEqual([
      'Vital signs are outside safe limits',
      'Spacewalk in the last 24 hours',
    ])
  })

  it('never lowers the level and never goes above CRITICAL', () => {
    const r = assessSeverity(breathing, { answerIds: ['q1c'], context: afterEVA }) // red flag
    expect(r.severity).toBe('CRITICAL')
    expect(r.reasons).not.toContain('Spacewalk in the last 24 hours')
  })
})
