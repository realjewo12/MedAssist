// test/nuxt/sleep.test.ts   (gap analysis C-7, D-6 in the app)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VitalSample } from '~/types'
import HomePage from '~/pages/index.vue'

const still: VitalSample = { ts: 0, hr: 58, spo2: 98, rr: 12, skinTemp: 36.4, motion: 0.01 }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-15T02:00')) // during the night of the 14th
  useSleep().clear()
  useAlerts().reset()
  useEnvironment().resetDose()
})
afterEach(() => vi.useRealTimers())

describe('useSleep', () => {
  it('counts still seconds, not moving ones, for the current night', () => {
    const { record, log } = useSleep()
    for (let i = 0; i < 90; i++) record({ ...still, ts: Date.now() + i * 1000 })
    for (let i = 0; i < 30; i++) record({ ...still, motion: 0.3, ts: Date.now() })
    expect(log.value['2026-11-14']).toBe(90)
  })

  it('saves to the device once a minute', () => {
    const { record } = useSleep()
    for (let i = 0; i < 60; i++) record({ ...still, ts: Date.now() })
    expect(JSON.parse(localStorage.getItem('medassist-sleep') ?? '{}')['2026-11-14']).toBe(60)
  })
})

describe('home page score', () => {
  it('shows the three parts, and the WATCH notice after 3 short nights', async () => {
    vi.setSystemTime(new Date('2026-11-15T09:00'))
    useSleep().setDemoNights([4, 4.5, 5])
    useEnvironment().addDemoDose(600)
    const w = await mountSuspended(HomePage)
    const text = w.text()
    expect(text).toContain('Alerts')
    expect(text).toContain('4.0 h last night; short nights in a row')
    expect(text).toContain('600 µGy since start')
    expect(text).toContain('short sleep 3 nights in a row')
    expect(text).toContain('65 / 100') // 100 − 0 − 25 (sleep) − 10 (dose)
  })

  it('no WATCH notice after good nights', async () => {
    vi.setSystemTime(new Date('2026-11-15T09:00'))
    useSleep().setDemoNights([8, 7.5, 8])
    const w = await mountSuspended(HomePage)
    expect(w.text()).not.toContain('short sleep')
    expect(w.text()).toContain('100 / 100')
  })
})
