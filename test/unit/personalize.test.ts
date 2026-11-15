// test/unit/personalize.test.ts   (plain Vitest, no Nuxt)
// When the person chose ME, every text must speak to them directly.
import { describe, expect, it } from 'vitest'
import { personalize } from '../../app/utils/personalize'
import { assessSeverity } from '../../app/utils/triageEngine'
import type { Problem, Protocol, Severity } from '../../app/types'
import problemsData from '../../app/data/problems.json'
import chestPain from '../../app/data/protocols/chest-pain.json'

const files = import.meta.glob('../../app/data/protocols/*.json', {
  eager: true,
  import: 'default',
})
const protocols = Object.values(files) as Protocol[]
const problems = problemsData as Problem[]
const severities: Severity[] = ['LOW', 'MODERATE', 'CRITICAL']
const THIRD_PERSON = /\b(they|them|their|the person)\b/i

// protocols a person can read about themselves (not crew-wide, not "not responding")
const forSelf = protocols.filter(
  (p) => !p.crewWide && !problems.find((pr) => pr.id === p.id)?.notForSelf,
)

describe('personalize', () => {
  it('changes nothing for a teammate', () => {
    const p = chestPain as Protocol
    expect(personalize(p, 'TEAMMATE')).toBe(p)
  })

  it('speaks to the person for ME, and keeps ids and scores (same triage)', () => {
    const p = chestPain as Protocol
    const me = personalize(p, 'SELF')
    expect(me.questions[1]?.text).toBe('Are you sweating, pale or feeling sick?')
    expect(me.steps.MODERATE[0]?.text).toBe('Stop all activity. Sit down.')
    expect(assessSeverity(me, { answerIds: ['q1b', 'q2c', 'q3c'] })).toEqual(
      assessSeverity(p, { answerIds: ['q1b', 'q2c', 'q3c'] }),
    )
  })

  it('"Not responding" is not offered to someone answering for themselves', () => {
    expect(problems.find((p) => p.id === 'not-responding')?.notForSelf).toBe(true)
  })

  for (const raw of forSelf) {
    describe(raw.id, () => {
      const me = personalize(raw, 'SELF')

      it('has no "they / them / their / the person" left for ME', () => {
        const texts = [
          ...me.questions.map((q) => q.text),
          ...me.questions.flatMap((q) => q.answers.map((a) => a.label)),
          ...severities.map((s) => me.summary[s]),
          ...severities.flatMap((s) => me.steps[s].map((st) => st.text)),
          me.callBaseWhen,
        ]
        expect(texts.filter((t) => THIRD_PERSON.test(t))).toEqual([])
      })

      it('"you" steps follow the same rules: 15 words max, ALERT BASE when CRITICAL', () => {
        for (const s of severities)
          for (const st of me.steps[s])
            expect(st.text.split(' ').length, st.text).toBeLessThanOrEqual(15)
        expect(me.steps.CRITICAL.some((st) => st.text.includes('ALERT BASE'))).toBe(true)
      })
    })
  }
})
