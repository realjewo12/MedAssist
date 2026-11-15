// test/unit/sleepAndScore.test.ts   (plain Vitest, no Nuxt) — gap analysis C-7, D-6
import { describe, expect, it } from 'vitest'
import {
  lastNightHours,
  lastNightKey,
  nightKey,
  recentNights,
  shortSleepStreak,
} from '../../app/utils/sleep'
import { healthScore } from '../../app/utils/healthScore'

const at = (s: string) => new Date(s).getTime() // local time

describe('nights run noon to noon', () => {
  it('23:00 and 05:00 the next morning belong to the same night', () => {
    expect(nightKey(at('2026-11-14T23:00'))).toBe('2026-11-14')
    expect(nightKey(at('2026-11-15T05:00'))).toBe('2026-11-14')
  })

  it('"last night" is the night that ended this morning, all day long', () => {
    expect(lastNightKey(at('2026-11-15T09:00'))).toBe('2026-11-14')
    expect(lastNightKey(at('2026-11-15T20:00'))).toBe('2026-11-14')
  })

  it('lists recent nights, most recent first (across a month change)', () => {
    expect(recentNights(at('2026-12-02T09:00'), 3)).toEqual([
      '2026-12-01',
      '2026-11-30',
      '2026-11-29',
    ])
  })
})

describe('sleep summary', () => {
  const now = at('2026-11-15T09:00')
  const h = (hours: number) => hours * 3600

  it('hours last night, or null without data', () => {
    expect(lastNightHours({ '2026-11-14': h(7.5) }, now)).toBe(7.5)
    expect(lastNightHours({}, now)).toBeNull()
  })

  it('3 short nights in a row is a streak; one good night breaks it', () => {
    const short = { '2026-11-14': h(4), '2026-11-13': h(5), '2026-11-12': h(5.5) }
    expect(shortSleepStreak(short, now)).toBe(true)
    expect(shortSleepStreak({ ...short, '2026-11-13': h(7) }, now)).toBe(false)
  })

  it('a missing night is unknown, not short', () => {
    expect(shortSleepStreak({ '2026-11-14': h(4), '2026-11-13': h(4) }, now)).toBe(false)
  })
})

describe('healthScore (gap analysis D-6)', () => {
  const calm = {
    criticalAlerts: 0,
    warningAlerts: 0,
    sleepHours: 8,
    shortSleepStreak: false,
    doseUGy: 50,
  }

  it('a calm day scores 100, with every part at 0', () => {
    const s = healthScore(calm)
    expect(s.total).toBe(100)
    expect(s.status).toBe('Good')
    expect(s.parts.map((p) => p.penalty)).toEqual([0, 0, 0])
  })

  it('each part explains its own penalty', () => {
    const s = healthScore({
      criticalAlerts: 1,
      warningAlerts: 1,
      sleepHours: 4,
      shortSleepStreak: true,
      doseUGy: 700,
    })
    expect(s.parts).toEqual([
      expect.objectContaining({ id: 'alerts', penalty: 35 }),
      expect.objectContaining({
        id: 'sleep',
        penalty: 25,
        detail: expect.stringContaining('in a row'),
      }),
      expect.objectContaining({ id: 'dose', penalty: 10 }),
    ])
    expect(s.total).toBe(30)
    expect(s.status).toBe('Concern')
  })

  it('no sleep data costs nothing, and the score never goes below 0', () => {
    expect(healthScore({ ...calm, sleepHours: null }).parts[1]?.penalty).toBe(0)
    expect(
      healthScore({
        ...calm,
        criticalAlerts: 9,
        sleepHours: 2,
        shortSleepStreak: true,
        doseUGy: 5000,
      }).total,
    ).toBe(0)
  })
})
