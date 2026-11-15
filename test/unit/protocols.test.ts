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

// Measured in Chrome: the longest step that fits in 2 lines at 24 px on a 360 px phone.
// A character count is only an estimate: re-run `npm run check:lines` after editing steps.
const MAX_STEP_CHARS = 47
// Words an outsider would not understand when the protocol is read aloud
const JARGON =
  /\b(CPR|AED|defibrillator|airway|recovery position|cardiac|decompression|hypoxia|consciousness|tourniquet|pressuri[sz]ed|dose-rate|shielded|SpO2|abnormal|symptoms?)\b/i

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

      // Sprint 3 polish: every instruction starts with a verb and fits on 2 lines on a phone
      const allSteps = severities.flatMap((s) =>
        p.steps[s].flatMap((st) => [st.text, st.textSelf].filter((t): t is string => !!t)),
      )
      it('starts every step with a verb', () => {
        const notAVerb = /^(If|When|The|A|An|Any|Your|Their|This|It|No|Still|They|You)\b/
        expect(allSteps.filter((t) => notAVerb.test(t))).toEqual([])
      })
      it(`keeps every step at ${MAX_STEP_CHARS} characters or fewer (2 lines at 24 px on a 360 px phone)`, () => {
        expect(allSteps.filter((t) => t.length > MAX_STEP_CHARS)).toEqual([])
      })
      it('uses no medical jargon anywhere a person reads', () => {
        const texts = [
          ...allSteps,
          ...p.questions.flatMap((q) => [
            q.text,
            q.textSelf ?? '',
            ...q.answers.map((a) => a.label),
          ]),
          ...severities.flatMap((s) => [p.summary[s], p.summarySelf?.[s] ?? '']),
          p.callBaseWhen,
          p.callBaseWhenSelf ?? '',
        ]
        expect(texts.filter((t) => JARGON.test(t))).toEqual([])
      })
      it('tells the user to alert the base when CRITICAL', () => {
        expect(p.steps.CRITICAL.some((step) => step.text.includes('ALERT BASE'))).toBe(true)
      })
    })
  }
})
