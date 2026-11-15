// app/composables/useProtocols.ts
import type { Problem, Protocol } from '~/types'
import problemsData from '~/data/problems.json'
import heavyBleeding from '~/data/protocols/heavy-bleeding.json'
import hardToBreathe from '~/data/protocols/hard-to-breathe.json'
import chestPain from '~/data/protocols/chest-pain.json'
import notResponding from '~/data/protocols/not-responding.json'

// All protocols are bundled into the app: no network needed
const PROTOCOLS: Record<string, Protocol> = {
  'heavy-bleeding': heavyBleeding as Protocol,
  'hard-to-breathe': hardToBreathe as Protocol,
  'chest-pain': chestPain as Protocol,
  'not-responding': notResponding as Protocol,
}

export function useProtocols() {
  const problems = problemsData as Problem[]
  function getProtocol(id: string): Protocol | undefined {
    return PROTOCOLS[id]
  }
  return { problems, getProtocol }
}