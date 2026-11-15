// app/composables/useSleep.ts
// Gap analysis C-7: turns the motion the wristband already records into sleep data.
import type { VitalSample } from '~/types'
import type { SleepLog } from '~/utils/sleep'

const STORAGE_KEY = 'medassist-sleep'

function load(): SleepLog {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as SleepLog
  } catch {
    return {}
  }
}

export function useSleep() {
  const log = useState<SleepLog>('sleep-log', load)

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log.value))
    } catch {
      // not saved: kept in memory until the app is closed
    }
  }

  /** Called once per second by the monitor plugin: a still second counts as asleep */
  function record(v: VitalSample) {
    if (v.motion >= SLEEP_MOTION_G) return
    const key = nightKey(v.ts)
    log.value = { ...log.value, [key]: (log.value[key] ?? 0) + 1 }
    if (log.value[key]! % 60 === 0) save() // write once a minute, not every second
  }

  /** Read again on each access: "last night" changes with the time of day */
  const lastNight = computed(() => lastNightHours(log.value, Date.now()))
  const shortStreak = computed(() => shortSleepStreak(log.value, Date.now()))

  /** Demo page: pretend the last nights had these hours of sleep (most recent first) */
  function setDemoNights(hours: number[]) {
    const keys = recentNights(Date.now(), hours.length)
    const next = { ...log.value }
    keys.forEach((k, i) => (next[k] = Math.round(hours[i]! * 3600)))
    log.value = next
    save()
  }

  function clear() {
    log.value = {}
    save()
  }

  return { log, lastNight, shortStreak, record, setDemoNights, clear }
}
