// test/nuxt/useMission.test.ts   (gap analysis B-4: mission context)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-15T10:00:00Z'))
  useMission().setRecentEVA(false)
  useMission().setGravityPhase('micro')
})
afterEach(() => vi.useRealTimers())

describe('useMission', () => {
  it('a spacewalk counts as recent for 24 h, then expires', () => {
    const { context, setRecentEVA } = useMission()
    setRecentEVA(true)
    expect(context.value.recentEVA).toBe(true)
    vi.setSystemTime(Date.now() + (EVA_RECENT_HOURS * 3600 - 1) * 1000)
    expect(useMission().context.value.recentEVA).toBe(true) // read again: recomputed
    vi.setSystemTime(Date.now() + 2000)
    expect(useMission().context.value.recentEVA).toBe(false)
  })

  it('remembers the context after a reload (localStorage)', () => {
    useMission().setGravityPhase('mars')
    useMission().setRecentEVA(true)
    const saved = JSON.parse(localStorage.getItem('medassist-mission') ?? '{}')
    expect(saved).toMatchObject({ gravityPhase: 'mars', evaEndedAt: Date.now() })
  })
})
