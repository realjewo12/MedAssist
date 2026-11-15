// test/nuxt/alerts.test.ts   (Nuxt environment: useState, router, black box)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { BlackBoxEvent, VitalSample } from '~/types'

const { beepSpy } = vi.hoisted(() => ({ beepSpy: vi.fn() }))
mockNuxtImport('beep', () => beepSpy)

const normal: VitalSample = { ts: 0, hr: 72, spo2: 98, rr: 14, skinTemp: 36.5, motion: 0.1 }
const lowO2 = (spo2 = 84): VitalSample => ({ ...normal, spo2 })

/** one reading per second, like the monitor plugin */
function feed(seconds: number, v: VitalSample) {
  const { check } = useAlerts()
  for (let i = 0; i < seconds; i++) {
    vi.setSystemTime(Date.now() + 1000)
    check({ ...v, ts: Date.now() })
  }
}

async function events() {
  const { records } = useBlackBox()
  await new Promise((r) => setTimeout(r, 0)) // let black box writes finish
  await useBlackBox().append('EVENT', { type: 'LINK_UP' }) // waits for the write queue
  return records.value
    .filter((r) => r.kind === 'EVENT')
    .map((r) => (r.data as BlackBoxEvent).type)
    .filter((t) => t !== 'LINK_UP')
}

/** the spo2 alert after 31 bad seconds */
function raiseOxygenAlert() {
  feed(31, lowO2())
  const a = useAlerts().open.value.find((x) => x.key === 'spo2')
  expect(a?.status).toBe('ACTIVE')
  return a!
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-15T10:00:00Z'))
  useAlerts().reset()
  await useBlackBox().append('EVENT', { type: 'LINK_UP' }) // wait for the previous test's writes
  useBlackBox().clearAll()
  await useRouter().push('/')
  beepSpy.mockClear()
})
afterEach(() => vi.useRealTimers())

describe('alerts: silence, re-sound, resolve', () => {
  it(`alerts only after ${SUSTAIN_SECONDS} s of bad readings, with sound`, () => {
    feed(30, lowO2())
    expect(useAlerts().alerts.value).toHaveLength(0)
    feed(1, lowO2())
    expect(useAlerts().active.value).toHaveLength(1)
    expect(beepSpy).toHaveBeenCalledTimes(1)
  })

  it('silence stops the sound and does NOT raise a new alert (the old bug)', async () => {
    const a = raiseOxygenAlert()
    useAlerts().silence(a.id)
    feed(4 * 60, lowO2()) // 4 more minutes, still low
    const { alerts, silenced } = useAlerts()
    expect(alerts.value).toHaveLength(1) // no duplicate
    expect(silenced.value[0]?.id).toBe(a.id)
    expect(beepSpy).toHaveBeenCalledTimes(1) // only the first alarm
    expect(await events()).toEqual(['ALERT_SILENCED'])
  })

  it(`sounds again after ${SILENCE_MINUTES} min if still out of range`, async () => {
    const a = raiseOxygenAlert()
    useAlerts().silence(a.id)
    feed(SILENCE_MINUTES * 60 - 1, lowO2())
    expect(useAlerts().active.value).toHaveLength(0)
    feed(1, lowO2())
    expect(useAlerts().active.value[0]?.id).toBe(a.id) // same alert, active again
    expect(beepSpy).toHaveBeenCalledTimes(2)
    expect(await events()).toEqual(['ALERT_SILENCED', 'ALERT_RESOUNDED'])
  })

  it(`sounds again at once if SpO2 drops ${SPO2_WORSE_POINTS} more points`, () => {
    const a = raiseOxygenAlert() // silenced at 84 %
    useAlerts().silence(a.id)
    feed(10, lowO2(80)) // 4 points worse: still silent
    expect(useAlerts().active.value).toHaveLength(0)
    feed(1, lowO2(79)) // 5 points worse
    expect(useAlerts().active.value[0]?.message).toContain('79%')
    expect(beepSpy).toHaveBeenCalledTimes(2)
  })

  it(`resolves only after ${RECOVER_SECONDS} s in range; a bad reading restarts the count`, async () => {
    const a = raiseOxygenAlert()
    useAlerts().silence(a.id)
    feed(60, normal)
    feed(1, lowO2()) // relapse
    feed(RECOVER_SECONDS, normal) // first good reading + 119 s
    expect(useAlerts().open.value).toHaveLength(1)
    feed(1, normal)
    expect(useAlerts().open.value).toHaveLength(0)
    expect(useAlerts().alerts.value[0]?.status).toBe('RESOLVED')
    expect(await events()).toEqual(['ALERT_SILENCED', 'ALERT_RESOLVED'])
  })

  it('a new episode after resolving gives a new alert', () => {
    const a = raiseOxygenAlert()
    feed(RECOVER_SECONDS + 1, normal)
    const b = raiseOxygenAlert()
    expect(b.id).not.toBe(a.id)
  })

  it('stays quiet during an emergency, sounds again after leaving it', async () => {
    await useRouter().push('/emergency')
    feed(31, lowO2())
    const a = useAlerts().active.value[0]!
    expect(beepSpy).not.toHaveBeenCalled() // raised, but no sound
    useAlerts().silence(a.id)
    feed(SILENCE_MINUTES * 60 + 30, lowO2())
    expect(useAlerts().silenced.value).toHaveLength(1) // no re-sound inside the emergency
    expect(beepSpy).not.toHaveBeenCalled()

    await useRouter().push('/')
    feed(1, lowO2())
    expect(useAlerts().active.value).toHaveLength(1)
    expect(beepSpy).toHaveBeenCalledTimes(1)
  })

  it('fall: alert after a shock and stillness, resolved after moving again', () => {
    feed(1, { ...normal, motion: 6 })
    feed(16, { ...normal, motion: 0 })
    const fall = useAlerts().active.value.find((a) => a.key === 'fall')!
    expect(fall.problemId).toBe('not-responding')
    useAlerts().silence(fall.id)
    feed(RECOVER_SECONDS + 1, normal) // moving again
    expect(useAlerts().open.value).toHaveLength(0)
  })
})
