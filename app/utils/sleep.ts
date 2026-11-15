// app/utils/sleep.ts
// Gap analysis C-7: sleep from motion, like NASA's ARCHeR wrist actigraphy.
// Pure functions: easy to test. All numbers are team demo values.
// (no comma on an 'export const' line: Nuxt's auto-import scanner misreads it)

export const SLEEP_MOTION_G = 0.05 // movement below this counts as asleep
export const SHORT_SLEEP_HOURS = 6 // a night with less sleep is short
export const SHORT_NIGHTS_IN_A_ROW = 3 // this many short nights -> WARNING

/** seconds asleep per night, e.g. { '2026-11-14': 25200 } */
export type SleepLog = Record<string, number>

const HOUR = 3600 * 1000

/** Local date as YYYY-MM-DD */
function dateKey(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** A "night" runs noon to noon: sleep at 23:00 and at 05:00 count for the same night */
export function nightKey(ts: number): string {
  return dateKey(ts - 12 * HOUR)
}

/** The night that ended this morning (or is going on now, before noon) */
export function lastNightKey(now: number): string {
  const hour = new Date(now).getHours()
  return hour < 12 ? nightKey(now) : dateKey(now - 24 * HOUR)
}

/** Keys of the last `count` nights, most recent first */
export function recentNights(now: number, count: number): string[] {
  const last = lastNightKey(now)
  const [y, m, d] = last.split('-').map(Number) as [number, number, number]
  return Array.from({ length: count }, (_, i) => dateKey(new Date(y, m - 1, d - i).getTime()))
}

/** Hours slept last night, or null when there is no data for it */
export function lastNightHours(log: SleepLog, now: number): number | null {
  const seconds = log[lastNightKey(now)]
  return seconds === undefined ? null : seconds / 3600
}

/** true when each of the last SHORT_NIGHTS_IN_A_ROW nights has data and is short */
export function shortSleepStreak(log: SleepLog, now: number): boolean {
  return recentNights(now, SHORT_NIGHTS_IN_A_ROW).every((key) => {
    const seconds = log[key]
    return seconds !== undefined && seconds / 3600 < SHORT_SLEEP_HOURS
  })
}
