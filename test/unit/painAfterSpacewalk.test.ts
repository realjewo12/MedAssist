// test/unit/painAfterSpacewalk.test.ts   (plain Vitest, no Nuxt) — gap analysis B-2
import { describe, expect, it } from 'vitest'
import { assessSeverity } from '../../app/utils/triageEngine'
import type { Protocol } from '../../app/types'
import data from '../../app/data/protocols/pain-after-spacewalk.json'

const p = data as Protocol
const sev = (answerIds: string[], recentEVA = false) =>
  assessSeverity(p, { answerIds, context: { recentEVA, gravityPhase: 'micro' } }).severity

describe('pain after spacewalk', () => {
  it('is linked to decompression sickness', () => {
    expect(p.hazardId).toBe('decompression')
  })

  it('no spacewalk, pain not in a joint → LOW', () => {
    expect(sev(['q1a', 'q2a', 'q3a'])).toBe('LOW')
  })

  it('spacewalk + one joint → MODERATE', () => {
    expect(sev(['q1b', 'q2b', 'q3a'])).toBe('MODERATE') // 3 + 3 = 6
  })

  it('spacewalk + several joints → CRITICAL', () => {
    expect(sev(['q1b', 'q2c', 'q3a'])).toBe('CRITICAL') // 3 + 5 = 8
  })

  it('numbness, weakness or confusion is always CRITICAL', () => {
    expect(sev(['q1a', 'q2a', 'q3b'])).toBe('CRITICAL')
  })

  it('the mission context also knows about the spacewalk: one level more', () => {
    expect(sev(['q1b', 'q2b', 'q3a'], true)).toBe('CRITICAL') // MODERATE + spacewalk
  })
})
