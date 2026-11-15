// test/unit/dizzyOrFainting.test.ts   (plain Vitest, no Nuxt) — gap analysis B-3
import { describe, expect, it } from 'vitest'
import { assessSeverity } from '../../app/utils/triageEngine'
import type { Protocol } from '../../app/types'
import data from '../../app/data/protocols/dizzy-or-fainting.json'

const p = data as Protocol
const sev = (answerIds: string[]) => assessSeverity(p, { answerIds }).severity

describe('dizzy or fainting', () => {
  it('is linked to the sensorimotor risk', () => {
    expect(p.hazardId).toBe('sensorimotor')
  })

  it('only dizzy when moving → LOW', () => {
    expect(sev(['q1a', 'q2a', 'q3a'])).toBe('LOW') // 1
  })

  it('after a gravity change and still dizzy lying down → MODERATE', () => {
    expect(sev(['q1b', 'q2a', 'q3b'])).toBe('MODERATE') // 2 + 3
  })

  it('confused or cannot sit up after a gravity change → CRITICAL', () => {
    expect(sev(['q1b', 'q2a', 'q3c'])).toBe('CRITICAL') // 2 + 6
  })

  it('losing consciousness is always CRITICAL', () => {
    expect(sev(['q1a', 'q2b'])).toBe('CRITICAL')
  })
})
