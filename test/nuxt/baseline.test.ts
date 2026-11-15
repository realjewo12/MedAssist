// test/nuxt/baseline.test.ts   (gap analysis C-2: the person's normal values)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { VitalSample } from '~/types'
import { BASELINE_MIN_SAMPLES } from '~/composables/useVitals'

const { beepSpy } = vi.hoisted(() => ({ beepSpy: vi.fn() }))
mockNuxtImport('beep', () => beepSpy)

const sample = (hr: number, extra: Partial<VitalSample> = {}): VitalSample => ({
  ts: 0,
  hr,
  spo2: 98,
  rr: 14,
  skinTemp: 36.5,
  motion: 0.1,
  ...extra,
})

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-15T10:00:00Z'))
  useVitals().history.value = []
  useAlerts().reset()
  useMission().setGravityPhase('micro')
  await useBlackBox().append('EVENT', { type: 'LINK_UP' })
  useBlackBox().clearAll()
})
afterEach(() => vi.useRealTimers())

describe('useVitals baseline', () => {
  it('is unknown until about a minute of safe readings', () => {
    const { history, baseline } = useVitals()
    history.value = Array.from({ length: BASELINE_MIN_SAMPLES - 1 }, () => sample(60))
    expect(baseline.value).toBeNull()
    history.value = [...history.value, sample(60)]
    expect(baseline.value?.hr).toBe(60)
  })

  it('is the median, and ignores readings outside the fixed limits', () => {
    const { history, baseline } = useVitals()
    history.value = [
      ...Array.from({ length: 70 }, (_, i) => sample(58 + (i % 5))), // 58..62
      ...Array.from({ length: 50 }, () => sample(130)), // fast heart: past the fixed WARNING
      ...Array.from({ length: 20 }, () => sample(60, { spo2: 88 })), // a problem: not "normal"
    ]
    expect(baseline.value?.hr).toBe(60)
  })

  it('an alert uses it: heart rate 75 is a WARNING for someone whose normal is 60', () => {
    useVitals().history.value = Array.from({ length: 120 }, () => sample(60))
    const { check } = useAlerts()
    for (let i = 0; i < 31; i++) {
      vi.setSystemTime(Date.now() + 1000)
      check(sample(75))
    }
    const hr = useAlerts().open.value.find((a) => a.key === 'hr')
    expect(hr?.level).toBe('WARNING')
    expect(beepSpy).not.toHaveBeenCalled()
  })
})
