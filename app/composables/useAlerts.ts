// app/composables/useAlerts.ts
import type { Alert, BlackBoxEvent, VitalSample } from '~/types'
import type { VitalKey, VitalLevel } from '~/utils/vitalLimits'

export const SUSTAIN_SECONDS = 30 // requirement FR-MON-04. Set to 10 for a faster demo.
export const FALL_STILL_SECONDS = 15 // no movement after a shock
export const SILENCE_MINUTES = 5 // a silenced alarm sounds again if the problem is still there
export const RECOVER_SECONDS = 120 // back to OK this long = resolved
export const SPO2_WORSE_POINTS = 5 // silenced, but oxygen fell this much more: sound now

type Level = Alert['level'] // 'WARNING' | 'CRITICAL'

interface VitalRule {
  key: VitalKey // limits for both levels: utils/vitalLimits.ts
  problemId?: string // which emergency protocol fits this alert
  message: (v: VitalSample, level: Level) => string
  isWorse?: (now: number, atSilence: number) => boolean
}

const RULES: VitalRule[] = [
  {
    key: 'spo2',
    problemId: 'hard-to-breathe',
    message: (v, l) =>
      l === 'CRITICAL'
        ? `Oxygen is low (${v.spo2}%). Check the suit and air supply.`
        : `Oxygen is dropping (${v.spo2}%). Rest and watch it.`,
    isWorse: (now, atSilence) => now <= atSilence - SPO2_WORSE_POINTS,
  },
  {
    key: 'hr',
    problemId: 'chest-pain',
    message: (v, l) =>
      l === 'CRITICAL'
        ? `Heart rate is abnormal (${v.hr} bpm). Stop and rest.`
        : `Heart rate is high (${v.hr} bpm). Slow down.`,
  },
  {
    key: 'rr',
    problemId: 'hard-to-breathe',
    message: (v, l) =>
      l === 'CRITICAL'
        ? `Breathing is abnormal (${v.rr}/min). Check the air supply.`
        : `Breathing is fast (${v.rr}/min). Rest and watch it.`,
  },
  {
    // gap C-6. Skin, not core temperature. Not used by triage.
    key: 'skinTemp',
    message: (v, l) =>
      l === 'CRITICAL'
        ? `Skin temperature is very high (${v.skinTemp} °C). Cool down now.`
        : `Skin temperature is rising (${v.skinTemp} °C). Drink and cool down.`,
  },
]

const FALL_MESSAGE = `Possible fall: no movement for ${FALL_STILL_SECONDS} seconds.`

export function useAlerts() {
  const alerts = useState<Alert[]>('alerts', () => [])
  const badSince = useState<Record<string, number | null>>('alerts-bad-since', () => ({}))
  const criticalSince = useState<Record<string, number | null>>('alerts-crit-since', () => ({}))
  const goodSince = useState<Record<string, number | null>>('alerts-good-since', () => ({}))
  const shockAt = useState<number | null>('alerts-shock-at', () => null)
  const lastSample = useState<VitalSample | null>('alerts-last-sample', () => null)
  const { append } = useBlackBox()
  const router = useRouter()

  /** shown on the banner (red = CRITICAL, amber outline = WARNING) */
  const active = computed(() => alerts.value.filter((a) => a.status === 'ACTIVE'))
  /** seen and silenced, but the problem is not over */
  const silenced = computed(() => alerts.value.filter((a) => a.status === 'SILENCED'))
  /** not resolved yet (active or silenced) */
  const open = computed(() => alerts.value.filter((a) => a.status !== 'RESOLVED'))

  // No sound while someone is following an emergency protocol
  const inEmergency = () => router.currentRoute.value.path.startsWith('/emergency')

  const log = (event: BlackBoxEvent) => append('EVENT', event)
  const openFor = (key: string) => open.value.find((a) => a.key === key)
  const update = (id: string, change: Partial<Alert>) =>
    (alerts.value = alerts.value.map((a) => (a.id === id ? { ...a, ...change } : a)))
  const setTimer = (timer: typeof badSince, key: string, value: number | null) =>
    (timer.value = { ...timer.value, [key]: value })
  const heldFor = (since: number | null | undefined, now: number) =>
    since != null && (now - since) / 1000 >= SUSTAIN_SECONDS

  // WARNING never makes a sound. CRITICAL beeps, except during an emergency
  // unless forced (a worsening always beeps).
  function sound(level: Level, force = false) {
    if (level !== 'CRITICAL' || (inEmergency() && !force)) return
    beep(800)
    navigator.vibrate?.([300, 100, 300])
  }

  function raise(key: string, level: Level, message: string, problemId?: string) {
    const alert: Alert = {
      id: newId(),
      key,
      ts: Date.now(),
      level,
      message,
      problemId,
      status: 'ACTIVE',
    }
    alerts.value = [...alerts.value, alert]
    setTimer(goodSince, key, null)
    append('ALERT', alert) // every alert goes to the black box
    sound(level)
  }

  /** WARNING → CRITICAL on the same alert. A worsening: it always beeps. */
  function escalate(alert: Alert, message: string) {
    const change = { level: 'CRITICAL' as const, status: 'ACTIVE' as const, message }
    update(alert.id, change)
    // a new ALERT record so the base gets it first (sync sends CRITICAL alerts first)
    append('ALERT', { ...alert, ...change, escalatedFrom: 'WARNING' })
    sound('CRITICAL', true)
  }

  /** Follow an open alert: resolve it, or bring it back when silence ends. */
  function follow(
    key: string,
    bad: boolean,
    value: number,
    message: string,
    isWorse: VitalRule['isWorse'],
    now: number,
  ) {
    const alert = openFor(key)
    if (!alert) return

    if (!bad) {
      // back to OK: resolved only after RECOVER_SECONDS in a row
      const since = goodSince.value[key] ?? now
      setTimer(goodSince, key, since)
      if ((now - since) / 1000 >= RECOVER_SECONDS) {
        update(alert.id, { status: 'RESOLVED', resolvedAt: now })
        setTimer(goodSince, key, null)
        log({ type: 'ALERT_RESOLVED', alertId: alert.id })
      }
      return
    }

    setTimer(goodSince, key, null) // bad again: restart recovery
    if (alert.status !== 'SILENCED') return

    const worse =
      alert.silencedValue !== undefined && isWorse?.(value, alert.silencedValue) === true
    // the 5-minute reminder waits until the emergency screens are closed
    const timedOut =
      !inEmergency() && (now - (alert.silencedAt ?? now)) / 1000 >= SILENCE_MINUTES * 60
    if (worse || timedOut) {
      update(alert.id, { status: 'ACTIVE', message })
      log({ type: 'ALERT_RESOUNDED', alertId: alert.id, reason: worse ? 'WORSE' : 'TIMEOUT' })
      sound(alert.level, worse) // getting worse always beeps, even during an emergency
    }
  }

  function check(v: VitalSample) {
    const now = Date.now()
    lastSample.value = v

    // Vitals: WARNING or CRITICAL held for SUSTAIN_SECONDS -> alert or escalation
    for (const rule of RULES) {
      const value = v[rule.key]
      const level: VitalLevel = vitalLevel(rule.key, value)
      setTimer(badSince, rule.key, level === 'OK' ? null : (badSince.value[rule.key] ?? now))
      setTimer(
        criticalSince,
        rule.key,
        level === 'CRITICAL' ? (criticalSince.value[rule.key] ?? now) : null,
      )
      const criticalHeld = heldFor(criticalSince.value[rule.key], now)
      const existing = openFor(rule.key)
      // the text always describes the current reading, even while the alert is
      // still a WARNING waiting for the critical value to be held 30 s
      const text = rule.message(v, level === 'CRITICAL' ? 'CRITICAL' : 'WARNING')

      if (!existing && heldFor(badSince.value[rule.key], now)) {
        raise(rule.key, criticalHeld ? 'CRITICAL' : 'WARNING', text, rule.problemId)
      } else if (existing?.level === 'WARNING' && criticalHeld) {
        escalate(existing, text)
      }

      follow(rule.key, level !== 'OK', value, text, rule.isWorse, now)
    }

    // Fall: a shock above 3 g, then almost no movement for FALL_STILL_SECONDS
    if (v.motion > 3) shockAt.value = now
    else if (shockAt.value && v.motion >= 0.05)
      shockAt.value = null // they moved: OK
    else if (shockAt.value && (now - shockAt.value) / 1000 >= FALL_STILL_SECONDS) {
      if (!openFor('fall')) raise('fall', 'CRITICAL', FALL_MESSAGE, 'not-responding')
      shockAt.value = null
    }
    // after a fall alert, "bad" means: still not moving
    if (v.motion <= 3) follow('fall', v.motion < 0.05, v.motion, FALL_MESSAGE, undefined, now)
  }

  /** "I saw it": stop the sound, keep watching the problem. */
  function silence(id: string) {
    const alert = alerts.value.find((a) => a.id === id)
    if (!alert || alert.status !== 'ACTIVE') return
    const v = lastSample.value
    const value = v ? (alert.key === 'fall' ? v.motion : v[alert.key as VitalKey]) : undefined
    update(id, { status: 'SILENCED', silencedAt: Date.now(), silencedValue: value })
    log({ type: 'ALERT_SILENCED', alertId: id })
  }

  /** Demo page: forget everything */
  function reset() {
    alerts.value = []
    badSince.value = {}
    criticalSince.value = {}
    goodSince.value = {}
    shockAt.value = null
  }

  return { alerts, active, silenced, open, check, silence, reset }
}
