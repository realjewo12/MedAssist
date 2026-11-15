// app/composables/useAlerts.ts
import type { Alert, BlackBoxEvent, VitalSample } from '~/types'

export const SUSTAIN_SECONDS = 30 // requirement FR-MON-04. Set to 10 for a faster demo.
export const FALL_STILL_SECONDS = 15 // no movement after a shock
export const SILENCE_MINUTES = 5 // a silenced alarm sounds again if the problem is still there
export const RECOVER_SECONDS = 120 // in the safe range this long = resolved
export const SPO2_WORSE_POINTS = 5 // silenced, but oxygen fell this much more: sound now

interface Rule {
  key: string
  problemId: string // which emergency protocol fits this alert
  isBad: (v: VitalSample) => boolean
  value: (v: VitalSample) => number // the reading shown and compared
  message: (v: VitalSample) => string
  isWorse?: (now: number, atSilence: number) => boolean
}

const RULES: Rule[] = [
  {
    key: 'spo2',
    problemId: 'hard-to-breathe',
    isBad: (v) => outOfRange('spo2', v.spo2), // limits: utils/vitalLimits.ts
    value: (v) => v.spo2,
    message: (v) => `Oxygen is low (${v.spo2}%). Check the suit and air supply.`,
    isWorse: (now, atSilence) => now <= atSilence - SPO2_WORSE_POINTS,
  },
  {
    key: 'hr',
    problemId: 'chest-pain',
    isBad: (v) => outOfRange('hr', v.hr),
    value: (v) => v.hr,
    message: (v) => `Heart rate is abnormal (${v.hr} bpm). Stop and rest.`,
  },
]

// After a fall alert, "bad" means: still not moving
const FALL_RULE: Rule = {
  key: 'fall',
  problemId: 'not-responding',
  isBad: (v) => v.motion < 0.05,
  value: (v) => v.motion,
  message: () => `Possible fall: no movement for ${FALL_STILL_SECONDS} seconds.`,
}

export function useAlerts() {
  const alerts = useState<Alert[]>('alerts', () => [])
  const badSince = useState<Record<string, number | null>>('alerts-bad-since', () => ({}))
  const goodSince = useState<Record<string, number | null>>('alerts-good-since', () => ({}))
  const shockAt = useState<number | null>('alerts-shock-at', () => null)
  const lastSample = useState<VitalSample | null>('alerts-last-sample', () => null)
  const { append } = useBlackBox()
  const router = useRouter()

  /** shown with sound: the banner */
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

  function sound() {
    if (inEmergency()) return
    beep(800)
    navigator.vibrate?.([300, 100, 300])
  }

  function raise(rule: Rule, v: VitalSample) {
    if (openFor(rule.key)) return // already known: never a second alert for the same problem
    const alert: Alert = {
      id: newId(),
      key: rule.key,
      ts: Date.now(),
      level: 'CRITICAL',
      message: rule.message(v),
      problemId: rule.problemId,
      status: 'ACTIVE',
    }
    alerts.value = [...alerts.value, alert]
    goodSince.value = { ...goodSince.value, [rule.key]: null }
    append('ALERT', alert) // every alert goes to the black box
    sound()
  }

  /** Follow an open alert: resolve it, or sound it again when silence ends. */
  function follow(rule: Rule, v: VitalSample, now: number) {
    const alert = openFor(rule.key)
    if (!alert) return

    if (!rule.isBad(v)) {
      // in range: resolved only after RECOVER_SECONDS in a row
      const since = goodSince.value[rule.key] ?? now
      goodSince.value = { ...goodSince.value, [rule.key]: since }
      if ((now - since) / 1000 >= RECOVER_SECONDS) {
        update(alert.id, { status: 'RESOLVED', resolvedAt: now })
        goodSince.value = { ...goodSince.value, [rule.key]: null }
        log({ type: 'ALERT_RESOLVED', alertId: alert.id })
      }
      return
    }

    goodSince.value = { ...goodSince.value, [rule.key]: null } // bad again: restart recovery
    if (alert.status !== 'SILENCED' || inEmergency()) return

    const value = rule.value(v)
    const worse =
      alert.silencedValue !== undefined && rule.isWorse?.(value, alert.silencedValue) === true
    const timedOut = (now - (alert.silencedAt ?? now)) / 1000 >= SILENCE_MINUTES * 60
    if (worse || timedOut) {
      update(alert.id, { status: 'ACTIVE', message: rule.message(v) })
      log({ type: 'ALERT_RESOUNDED', alertId: alert.id, reason: worse ? 'WORSE' : 'TIMEOUT' })
      sound()
    }
  }

  function check(v: VitalSample) {
    const now = Date.now()
    lastSample.value = v

    // Rules on values: bad for SUSTAIN_SECONDS in a row -> alert
    for (const rule of RULES) {
      if (rule.isBad(v)) {
        const since = badSince.value[rule.key] ?? now
        badSince.value = { ...badSince.value, [rule.key]: since }
        if ((now - since) / 1000 >= SUSTAIN_SECONDS) raise(rule, v)
      } else if (badSince.value[rule.key]) {
        badSince.value = { ...badSince.value, [rule.key]: null } // back in range: restart
      }
      follow(rule, v, now)
    }

    // Fall: a shock above 3 g, then almost no movement for FALL_STILL_SECONDS
    if (v.motion > 3) shockAt.value = now
    else if (shockAt.value && v.motion >= 0.05)
      shockAt.value = null // they moved: OK
    else if (shockAt.value && (now - shockAt.value) / 1000 >= FALL_STILL_SECONDS) {
      raise(FALL_RULE, v)
      shockAt.value = null
    }
    if (v.motion <= 3) follow(FALL_RULE, v, now)
  }

  /** "I saw it": stop the sound, keep watching the problem. */
  function silence(id: string) {
    const alert = alerts.value.find((a) => a.id === id)
    if (!alert || alert.status !== 'ACTIVE') return
    const rule = [...RULES, FALL_RULE].find((r) => r.key === alert.key)
    const v = lastSample.value
    update(id, {
      status: 'SILENCED',
      silencedAt: Date.now(),
      silencedValue: rule && v ? rule.value(v) : undefined,
    })
    log({ type: 'ALERT_SILENCED', alertId: id })
  }

  /** Demo page: forget everything */
  function reset() {
    alerts.value = []
    badSince.value = {}
    goodSince.value = {}
    shockAt.value = null
  }

  return { alerts, active, silenced, open, check, silence, reset }
}
