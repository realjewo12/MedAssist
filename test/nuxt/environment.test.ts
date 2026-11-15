// test/nuxt/environment.test.ts   (gap analysis C-5, D-3, D-4, B-7 in the app)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { EnvSample } from '~/types'
import EmergencyIndex from '~/pages/emergency/index.vue'

const { beepSpy, navSpy } = vi.hoisted(() => ({ beepSpy: vi.fn(), navSpy: vi.fn() }))
mockNuxtImport('beep', () => beepSpy)
mockNuxtImport('navigateTo', () => navSpy)

const env = (extra: Partial<EnvSample>): EnvSample => ({
  ts: 0,
  pCO2: 2.5,
  cabinPressure: 101.3,
  doseRate: 15,
  ...extra,
})
function feedEnv(seconds: number, e: EnvSample, onRadiation?: () => void) {
  for (let i = 0; i < seconds; i++) {
    vi.setSystemTime(Date.now() + 1000)
    useAlerts().checkEnv({ ...e, ts: Date.now() }, onRadiation)
  }
}
const alertFor = (key: string) => useAlerts().open.value.find((a) => a.key === key)

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-15T10:00:00Z'))
  useAlerts().reset()
  useTriage().clear()
  navSpy.mockReset()
  beepSpy.mockClear()
  await useBlackBox().append('EVENT', { type: 'LINK_UP' })
  useBlackBox().clearAll()
})
afterEach(() => vi.useRealTimers())

describe('habitat alerts (C-5)', () => {
  it('cabin CO2: WARNING after 30 s above 4 mmHg, opens hard to breathe', () => {
    feedEnv(31, env({ pCO2: 5 }))
    expect(alertFor('co2')).toMatchObject({ level: 'WARNING', problemId: 'hard-to-breathe' })
    expect(beepSpy).not.toHaveBeenCalled()
  })

  it('radiation: CRITICAL with sound, opens the radiation protocol, asks for a DOSE record', () => {
    const onRadiation = vi.fn()
    feedEnv(31, env({ doseRate: 300 }), onRadiation)
    expect(alertFor('radiation')).toMatchObject({
      level: 'CRITICAL',
      problemId: 'radiation-alert',
    })
    expect(beepSpy).toHaveBeenCalledTimes(1)
    expect(onRadiation).toHaveBeenCalledTimes(1) // once when raised, not every second
  })
})

describe('sync order (D-4)', () => {
  it('sends a DOSE record before VITALS records', async () => {
    const { append } = useBlackBox()
    await append('VITALS', { hr: 72 })
    await append('DOSE', { doseRate: 300, cumulativeDose: 1 })
    vi.useRealTimers() // trySync waits 800 ms (pretend network)
    useSync().setOnline(true)
    await useSync().trySync()
    const order = useSync().lastBatch.value
    expect(order.indexOf('DOSE')).toBeLessThan(order.indexOf('VITALS'))
  })
})

describe('crew-wide problems (B-7)', () => {
  it('"Radiation alarm" skips "Who needs help?" and sets the target to CREW', async () => {
    const w = await mountSuspended(EmergencyIndex)
    const btn = w.findAll('button').find((b) => b.text().includes('Radiation alarm'))!
    await btn.trigger('click')
    expect(navSpy).toHaveBeenCalledWith('/emergency/severity')
    expect(useTriage().state.value).toMatchObject({
      problemId: 'radiation-alert',
      target: 'CREW',
    })
  })
})
