// test/unit/protocols.test.ts   (plain Vitest, no Nuxt)
import { describe, expect, it } from 'vitest'
import type { HazardId, Protocol, Severity } from '../../app/types'
import problems from '../../app/data/problems.json'

// Loads every JSON file in the protocols folder
const files = import.meta.glob('../../app/data/protocols/*.json', {
  eager: true,
  import: 'default',
})
const protocols = Object.values(files) as Protocol[]
const severities: Severity[] = ['LOW', 'MODERATE', 'CRITICAL']

describe('protocol files', () => {
  it('has one protocol per problem', () => {
    const ids = protocols.map((p) => p.id).sort()
    expect(ids).toEqual(problems.map((p) => p.id).sort())
  })

  for (const p of protocols) {
    describe(p.id, () => {
      it('names its NASA hazard and the source of its content', () => {
        const hazards: HazardId[] = [
          'hypoxia',
          'cardiovascular',
          'decompression',
          'sensorimotor',
          'spacewalk',
          'radiation',
          'general-trauma',
          'general-collapse',
        ]
        expect(hazards).toContain(p.hazardId)
        expect(p.source.length).toBeGreaterThan(10)
      })
      it('has moderate < critical', () => {
        expect(p.thresholds.moderate).toBeLessThan(p.thresholds.critical)
      })
      it('has a summary and at least one step for every severity', () => {
        for (const s of severities) {
          expect(p.summary[s].length).toBeGreaterThan(0)
          expect(p.steps[s].length).toBeGreaterThan(0)
        }
      })
      it('keeps every step at 15 words or fewer', () => {
        for (const s of severities) {
          for (const step of p.steps[s]) {
            expect(step.text.split(' ').length, step.text).toBeLessThanOrEqual(15)
          }
        }
      })
      it('tells the user to alert the base when CRITICAL', () => {
        expect(p.steps.CRITICAL.some((step) => step.text.includes('ALERT BASE'))).toBe(true)
      })
    })
  }
})
