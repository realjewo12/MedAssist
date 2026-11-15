// test/nuxt/useProtocols.test.ts   (Nuxt environment: checks the app really loads the files)
import { describe, expect, it } from 'vitest'

describe('useProtocols', () => {
  it('finds a protocol for every problem on the home screen', () => {
    const { problems, getProtocol } = useProtocols()
    expect(problems.length).toBeGreaterThan(0)
    for (const p of problems) expect(getProtocol(p.id)?.id, p.id).toBe(p.id)
  })

  it('returns undefined for an unknown id', () => {
    expect(useProtocols().getProtocol('no-such-problem')).toBeUndefined()
  })
})
