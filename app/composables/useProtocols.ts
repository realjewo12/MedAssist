// app/composables/useProtocols.ts   STUB – Track B replaces it
import type { Problem, Protocol } from '~/types'

export function useProtocols() {
  const problems: Problem[] = [{ id: 'heavy-bleeding', label: 'Heavy bleeding', icon: '🩸' }]
  function getProtocol(_id: string): Protocol | undefined {
    return undefined
  }
  return { problems, getProtocol }
}
