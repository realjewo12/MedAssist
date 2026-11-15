// test/unit/sha256.test.ts   (plain Vitest, no Nuxt)
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sha256, sha256Js } from '../../app/utils/sha256'

const hex = (u: Uint8Array) => Buffer.from(u).toString('hex')
const nodeHash = (s: string) => createHash('sha256').update(s).digest('hex')

describe('sha256 fallback', () => {
  it('gives the official result for "abc"', () => {
    expect(hex(sha256Js(new TextEncoder().encode('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('matches Node for tricky lengths and characters', () => {
    const inputs = [
      '',
      'a'.repeat(55),
      'a'.repeat(56),
      'a'.repeat(64),
      'héllo 🚀',
      'x'.repeat(5000),
    ]
    for (const s of inputs) expect(hex(sha256Js(new TextEncoder().encode(s))), s).toBe(nodeHash(s))
  })

  it('gives the same result with and without crypto.subtle', async () => {
    const text = '0|1|1731650000000|ALERT|{"level":"CRITICAL"}'
    expect(await sha256(text)).toBe(nodeHash(text))
  })
})
