// app/utils/personalize.ts
// Speak to the person directly when they chose ME: "Sit upright." instead of
// "Sit them upright.". Texts come from the optional *Self fields of a protocol.
import type { Protocol, Severity, Target } from '~/types'

const LEVELS: Severity[] = ['LOW', 'MODERATE', 'CRITICAL']

/** The protocol as the person will read it. Same ids and scores: triage is unchanged. */
export function personalize(protocol: Protocol, target: Target | null): Protocol {
  if (target !== 'SELF') return protocol
  return {
    ...protocol,
    questions: protocol.questions.map((q) => ({
      ...q,
      text: q.textSelf ?? q.text,
      answers: q.answers.map((a) => ({ ...a, label: a.labelSelf ?? a.label })),
    })),
    summary: Object.fromEntries(
      LEVELS.map((l) => [l, protocol.summarySelf?.[l] ?? protocol.summary[l]]),
    ) as Record<Severity, string>,
    steps: Object.fromEntries(
      LEVELS.map((l) => [l, protocol.steps[l].map((s) => ({ ...s, text: s.textSelf ?? s.text }))]),
    ) as Protocol['steps'],
    callBaseWhen: protocol.callBaseWhenSelf ?? protocol.callBaseWhen,
  }
}
