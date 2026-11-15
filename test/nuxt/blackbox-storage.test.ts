// test/nuxt/blackbox-storage.test.ts   (gap analysis D-1: a failed save is shown, not lost)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const quotaError = () => new DOMException('full', 'QuotaExceededError')

beforeEach(async () => {
  await useBlackBox().append('EVENT', { type: 'LINK_UP' }) // let earlier writes finish
  useBlackBox().clearAll()
})
afterEach(() => vi.restoreAllMocks())

describe('black box storage', () => {
  it('reports how much it saved', async () => {
    const { append, savedChars, saveError } = useBlackBox()
    await append('EVENT', { type: 'LINK_DOWN' })
    expect(saveError.value).toBeNull()
    expect(savedChars.value).toBeGreaterThan(100)
  })

  it('when storage is full: shows the error, keeps the record in memory for sync', async () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw quotaError()
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { append, records, unsynced, saveError } = useBlackBox()

    await append('ALERT', { level: 'CRITICAL', message: 'test' })
    expect(saveError.value?.reason).toBe('storage is full')
    expect(records.value.at(-1)?.kind).toBe('ALERT') // still there
    expect(unsynced.value.some((r) => r.kind === 'ALERT')).toBe(true) // will still sync

    const firstSince = saveError.value!.since
    await append('EVENT', { type: 'LINK_UP' })
    expect(saveError.value?.since).toBe(firstSince) // keeps the time it started
  })

  it('clears the error once saving works again', async () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw quotaError()
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { append, saveError } = useBlackBox()
    await append('EVENT', { type: 'LINK_DOWN' })
    expect(saveError.value).not.toBeNull()

    spy.mockRestore()
    await append('EVENT', { type: 'LINK_UP' })
    expect(saveError.value).toBeNull()
  })
})
