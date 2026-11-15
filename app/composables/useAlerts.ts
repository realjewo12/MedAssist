// app/composables/useAlerts.ts
import type { Alert, BlackBoxEvent, EnvSample, VitalSample } from '~/types'
import type { ImpactRule, VitalKey, VitalLevel } from '~/utils/vitalLimits'
import type { EnvKey } from '~/utils/envLimits'

export const SUSTAIN_SECONDS = 30 // requirement FR-MON-04. Set to 10 for a faster demo.
export const FALL_STILL_SECONDS = 15 // no movement after an impact
export const SILENCE_MINUTES = 5 // a silenced alarm sounds again if the problem is still there
export const RECOVER_SECONDS = 30 // back to OK this long = resolved and the banner goes away
export const SPO2_WORSE_POINTS = 5 // silenced but oxygen fell this much more: sound now
export const CONTEXT_SECONDS = 60 // vitals saved with each alert for an accident review (gap D-2)

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

// gap analysis C-3: not 'Possible fall': in micro-g nobody falls
const IMPACT_MESSAGE = `Impact and no response for ${FALL_STILL_SECONDS} seconds.`

// Habitat rules (gap analysis C-5): limits in utils/envLimits.ts
interface EnvRule {
  key: string // alert key
  sensor: EnvKey
  problemId: string
  message: (e: EnvSample, level: Level) => string
}

const ENV_RULES: EnvRule[] = [
  {
    key: 'co2',
    sensor: 'pCO2',
    problemId: 'hard-to-breathe',
    message: (e, l) =>
      l === 'CRITICAL'
        ? `Cabin CO2 is high (${e.pCO2} mmHg). Move everyone to clean air.`
        : `Cabin CO2 is rising (${e.pCO2} mmHg). Check the air scrubber.`,
  },
  {
    key: 'radiation',
    sensor: 'doseRate',
    problemId: 'radiation-alert',
    message: (e, l) =>
      l === 'CRITICAL'
        ? `Radiation is high (${e.doseRate} µGy/h). Go to the shielded area now.`
        : `Radiation is rising (${e.doseRate} µGy/h). Get ready to shelter.`,
  },
]

export function useAlerts() {
  const alerts = useState<Alert[]>('alerts', () => [])
  const badSince = useState<Record<string, number | null>>('alerts-bad-since', () => ({}))
  const criticalSince = useState<Record<string, number | null>>('alerts-crit-since', () => ({}))
  const goodSince = useState<Record<string, number | null>>('alerts-good-since', () => ({}))
  // the impact moment and the heart/breathing rate just before it
  const shock = useState<{ at: number; hr: number; rr: number } | null>('alerts-shock', () => null)
  const lastSample = useState<VitalSample | null>('alerts-last-sample', () => null)
  const { append } = useBlackBox()
  const { history, baseline } = useVitals()
  const { context: mission } = useMission()
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

  /** One minute at 1 Hz is cheap (~5 kB) and is what an investigator needs most. */
  function saveContext(alertId: string) {
    const samples = history.value.slice(-CONTEXT_SECONDS)
    if (samples.length) log({ type: 'ALERT_CONTEXT', alertId, samples })
  }
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
    saveContext(alert.id)
    sound(level)
  }

  /** WARNING → CRITICAL on the same alert. A worsening: it always beeps. */
  function escalate(alert: Alert, message: string) {
    const change = { level: 'CRITICAL' as const, status: 'ACTIVE' as const, message }
    update(alert.id, change)
    // a new ALERT record so the base gets it first (sync sends CRITICAL alerts first)
    append('ALERT', { ...alert, ...change, escalatedFrom: 'WARNING' })
    saveContext(alert.id)
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

  /**
   * One rule, one reading: WARNING or CRITICAL held SUSTAIN_SECONDS -> alert,
   * WARNING -> CRITICAL escalation, then silence / re-sound / resolve.
   * Returns what happened, so callers can add records (e.g. a DOSE record).
   */
  function evaluate(
    key: string,
    level: VitalLevel,
    value: number,
    text: string,
    problemId: string | undefined,
    isWorse: VitalRule['isWorse'],
    now: number,
  ): 'raised' | 'escalated' | null {
    setTimer(badSince, key, level === 'OK' ? null : (badSince.value[key] ?? now))
    setTimer(criticalSince, key, level === 'CRITICAL' ? (criticalSince.value[key] ?? now) : null)
    const criticalHeld = heldFor(criticalSince.value[key], now)
    const existing = openFor(key)
    let happened: 'raised' | 'escalated' | null = null

    if (!existing && heldFor(badSince.value[key], now)) {
      raise(key, criticalHeld ? 'CRITICAL' : 'WARNING', text, problemId)
      happened = 'raised'
    } else if (existing?.level === 'WARNING' && criticalHeld) {
      escalate(existing, text)
      happened = 'escalated'
    }

    follow(key, level !== 'OK', value, text, isWorse, now)
    return happened
  }

  /** Habitat readings (gap analysis C-5): cabin CO2 and radiation dose rate */
  function checkEnv(e: EnvSample, onRadiationAlert?: () => void) {
    const now = Date.now()
    for (const rule of ENV_RULES) {
      const value = e[rule.sensor]
      const level = envLevel(rule.sensor, value)
      const text = rule.message(e, level === 'CRITICAL' ? 'CRITICAL' : 'WARNING')
      const happened = evaluate(rule.key, level, value, text, rule.problemId, undefined, now)
      if (happened && rule.key === 'radiation') onRadiationAlert?.() // e.g. a DOSE record (D-3)
    }
  }

  function check(v: VitalSample) {
    const now = Date.now()
    const before = lastSample.value ?? v // the reading one second earlier
    lastSample.value = v

    // Vitals: WARNING or CRITICAL held for SUSTAIN_SECONDS -> alert or escalation
    for (const rule of RULES) {
      const value = v[rule.key]
      const level = vitalLevel(rule.key, value, baseline.value?.[rule.key])
      // the text always describes the current reading, even while the alert is
      // still a WARNING waiting for the critical value to be held 30 s
      const text = rule.message(v, level === 'CRITICAL' ? 'CRITICAL' : 'WARNING')
      evaluate(rule.key, level, value, text, rule.problemId, rule.isWorse, now)
    }

    // Impact (gap analysis C-3): a spike above the limit for this gravity phase,
    // then almost no movement for FALL_STILL_SECONDS. In micro-g, floating still is
    // normal, so the heart or breathing rate must also have changed.
    const phase = mission.value.gravityPhase
    const impact: ImpactRule = IMPACT_LIMITS[phase]
    if (v.motion > impact.shockG) shock.value = { at: now, hr: before.hr, rr: before.rr }
    else if (shock.value && v.motion >= 0.05)
      shock.value = null // they moved: OK
    else if (shock.value && (now - shock.value.at) / 1000 >= FALL_STILL_SECONDS) {
      const vitalsChanged =
        Math.abs(v.hr - shock.value.hr) >= IMPACT_VITAL_CHANGE.hr ||
        Math.abs(v.rr - shock.value.rr) >= IMPACT_VITAL_CHANGE.rr
      if (!openFor('impact') && (!impact.needsVitalChange || vitalsChanged)) {
        // after landing, dizziness and fainting are the likely cause
        const problemId = phase === 'landing' ? 'dizzy-or-fainting' : 'not-responding'
        raise('impact', 'CRITICAL', IMPACT_MESSAGE, problemId)
      }
      shock.value = null
    }
    // after an impact alert, "bad" means: still not moving
    if (v.motion <= impact.shockG)
      follow('impact', v.motion < 0.05, v.motion, IMPACT_MESSAGE, undefined, now)
  }

  /** "I saw it": stop the sound, keep watching the problem. */
  function silence(id: string) {
    const alert = alerts.value.find((a) => a.id === id)
    if (!alert || alert.status !== 'ACTIVE') return
    const v = lastSample.value
    const value = v ? (alert.key === 'impact' ? v.motion : v[alert.key as VitalKey]) : undefined
    update(id, { status: 'SILENCED', silencedAt: Date.now(), silencedValue: value })
    log({ type: 'ALERT_SILENCED', alertId: id })
  }

  /** An emergency has started: every alarm is being taken care of (sound and banner off) */
  function silenceAll() {
    for (const a of active.value) silence(a.id)
  }

  /** Demo page: forget everything */
  function reset() {
    alerts.value = []
    badSince.value = {}
    criticalSince.value = {}
    goodSince.value = {}
    shock.value = null
  }

  return { alerts, active, silenced, open, check, checkEnv, silence, silenceAll, reset }
}
