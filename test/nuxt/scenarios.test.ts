// test/nuxt/scenarios.test.ts   (gap analysis C-4: new simulator scenarios drive the alerts)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Scenario } from '~/types'

const { beepSpy } = vi.hoisted(() => ({ beepSpy: vi.fn() }))
mockNuxtImport('beep', () => beepSpy)

/** run the simulator from second `from` to `to`, one reading per second, like the monitor plugin */
function run(scenario: Scenario, to: number, from = 1) {
  const { check } = useAlerts()
  for (let s = from; s <= to; s++) {
    vi.setSystemTime(Date.now() + 1000)
    check(simulateVitals(scenario, s))
  }
}
const alertFor = (key: string) => useAlerts().open.value.find((a) => a.key === key)

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-15T10:00:00Z'))
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // no noise: exact timings
  useAlerts().reset()
  await useBlackBox().append('EVENT', { type: 'LINK_UP' }) // let earlier writes finish
  useBlackBox().clearAll()
  await useRouter().push('/')
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('simulator scenarios', () => {
  it('eva-suit: oxygen WARNING first, then CRITICAL; breathing WARNING', () => {
    run('eva-suit', 45)
    expect(alertFor('spo2')?.level).toBe('WARNING') // below 94 from ~11 s, held 30 s
    run('eva-suit', 60, 46)
    expect(alertFor('spo2')?.level).toBe('CRITICAL') // below 90 from ~24 s, held 30 s
    expect(alertFor('rr')?.level).toBe('WARNING') // above 24 from ~21 s
  })

  it('faint: fast heart, impact, stillness → fall alert linked to "not responding"', () => {
    run('faint', 30)
    const fall = alertFor('fall')
    expect(fall?.level).toBe('CRITICAL')
    expect(fall?.problemId).toBe('not-responding')
    expect(alertFor('hr')).toBeUndefined() // the racing heart was too short to alert
  })
})
