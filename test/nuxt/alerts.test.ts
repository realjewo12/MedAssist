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

  it('getting worse beeps even during an emergency', async () => {
    await useRouter().push('/emergency')
    feed(31, lowO2()) // raised quietly at 84 %
    const a = useAlerts().active.value[0]!
    useAlerts().silence(a.id)
    feed(10, lowO2(80))
    expect(beepSpy).not.toHaveBeenCalled()
    feed(1, lowO2(79)) // 5 points worse
    expect(useAlerts().active.value[0]?.id).toBe(a.id)
    expect(beepSpy).toHaveBeenCalledTimes(1)
    expect(await events()).toEqual(['ALERT_SILENCED', 'ALERT_RESOUNDED'])
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

describe('alerts: two levels (gap C-1, C-6)', () => {
  const alertRecords = async () => {
    await useBlackBox().append('EVENT', { type: 'LINK_UP' }) // wait for the write queue
    return useBlackBox()
      .records.value.filter((r) => r.kind === 'ALERT')
      .map((r) => r.data as { level: string; escalatedFrom?: string })
  }

  it('WARNING: amber notice after 30 s, no sound', () => {
    feed(31, lowO2(92)) // below 94 (warning), above 90 (critical)
    const a = useAlerts().active.value[0]
    expect(a?.level).toBe('WARNING')
    expect(a?.message).toContain('dropping')
    expect(beepSpy).not.toHaveBeenCalled()
  })

  it('escalates the same alert to CRITICAL, with sound, after 30 s past the critical limit', async () => {
    feed(31, lowO2(92))
    const a = useAlerts().active.value[0]!
    feed(30, lowO2(88))
    expect(useAlerts().active.value[0]?.level).toBe('WARNING') // critical not held long enough
    feed(1, lowO2(88))
    const now = useAlerts().active.value
    expect(now).toHaveLength(1)
    expect(now[0]).toMatchObject({ id: a.id, level: 'CRITICAL' })
    expect(beepSpy).toHaveBeenCalledTimes(1)
    expect(await alertRecords()).toEqual([
      expect.objectContaining({ level: 'WARNING' }),
      expect.objectContaining({ level: 'CRITICAL', escalatedFrom: 'WARNING' }),
    ])
  })

  it('escalation beeps even during an emergency', async () => {
    await useRouter().push('/emergency')
    feed(31, lowO2(92))
    feed(31, lowO2(88))
    expect(useAlerts().active.value[0]?.level).toBe('CRITICAL')
    expect(beepSpy).toHaveBeenCalledTimes(1)
  })

  it('a WARNING-level reading does not count as recovered', () => {
    const a = raiseOxygenAlert() // CRITICAL at 84 %
    feed(RECOVER_SECONDS + 10, lowO2(92)) // better, but still below 94
    expect(useAlerts().open.value[0]?.id).toBe(a.id)
    feed(RECOVER_SECONDS + 1, normal)
    expect(useAlerts().open.value).toHaveLength(0)
  })

  it('skin temperature: WARNING above 38 °C, CRITICAL above 39.5 °C', () => {
    feed(31, { ...normal, skinTemp: 38.4 })
    expect(useAlerts().active.value[0]).toMatchObject({ key: 'skinTemp', level: 'WARNING' })
    feed(31, { ...normal, skinTemp: 39.8 })
    expect(useAlerts().active.value[0]).toMatchObject({ key: 'skinTemp', level: 'CRITICAL' })
    expect(useAlerts().active.value[0]?.problemId).toBeUndefined() // opens the problem list
  })

  it('breathing too slow goes straight to CRITICAL', () => {
    feed(31, { ...normal, rr: 6 })
    expect(useAlerts().active.value[0]).toMatchObject({ key: 'rr', level: 'CRITICAL' })
  })
})

describe('alerts: text matches the reading', () => {
  it('a WARNING raised while the reading is already critical says so', () => {
    feed(25, lowO2(92)) // warning-level for 25 s
    feed(6, lowO2(85)) // then critical: alert is still WARNING (critical not held 30 s)
    const a = useAlerts().active.value[0]
    expect(a?.level).toBe('WARNING')
    expect(a?.message).toContain('Oxygen is low (85%)')
  })
})
