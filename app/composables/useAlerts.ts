// app/composables/useAlerts.ts
import type { Alert, VitalSample } from '~/types'

const SUSTAIN_SECONDS = 30 // requirement FR-MON-04. Set to 10 for a faster demo.
const FALL_STILL_SECONDS = 15 // no movement after a shock

interface Rule {
  key: string
  problemId: string // which emergency protocol fits this alert
  isBad: (v: VitalSample) => boolean
  message: (v: VitalSample) => string
}

const RULES: Rule[] = [
  {
    key: 'spo2',
    problemId: 'hard-to-breathe',
    isBad: (v) => v.spo2 < 90,
    message: (v) => `Oxygen is low (${v.spo2}%). Check the suit and air supply.`,
  },
  {
    key: 'hr',
    problemId: 'chest-pain',
    isBad: (v) => v.hr > 140 || v.hr < 40,
    message: (v) => `Heart rate is abnormal (${v.hr} bpm). Stop and rest.`,
  },
]

export function useAlerts() {
  const alerts = useState<Alert[]>('alerts', () => [])
  const badSince = useState<Record<string, number | null>>('alerts-bad-since', () => ({}))
  const shockAt = useState<number | null>('alerts-shock-at', () => null)
  const active = computed(() => alerts.value.filter((a) => !a.acknowledged))
  const { append } = useBlackBox()

  function raise(key: string, message: string, problemId?: string) {
    if (active.value.some((a) => a.key === key)) return // already shown
    const alert: Alert = {
      id: newId(),
      key,
      ts: Date.now(),
      level: 'CRITICAL',
      message,
      problemId,
      acknowledged: false,
    }
    alerts.value = [...alerts.value, alert]
    append('ALERT', alert) // every alert goes to the black box
    beep(800)
    navigator.vibrate?.([300, 100, 300])
  }

  function check(v: VitalSample) {
    const now = Date.now()

    // Rules on values: bad for SUSTAIN_SECONDS in a row -> alert
    for (const rule of RULES) {
      if (rule.isBad(v)) {
        const since = badSince.value[rule.key] ?? now
        badSince.value = { ...badSince.value, [rule.key]: since }
        if ((now - since) / 1000 >= SUSTAIN_SECONDS)
          raise(rule.key, rule.message(v), rule.problemId)
      } else if (badSince.value[rule.key]) {
        badSince.value = { ...badSince.value, [rule.key]: null } // back to normal: reset
      }
    }

    // Fall: a shock above 3 g, then almost no movement for FALL_STILL_SECONDS
    if (v.motion > 3) shockAt.value = now
    else if (shockAt.value && v.motion >= 0.05)
      shockAt.value = null // they moved: OK
    else if (shockAt.value && (now - shockAt.value) / 1000 >= FALL_STILL_SECONDS) {
      raise(
        'fall',
        `Possible fall: no movement for ${FALL_STILL_SECONDS} seconds.`,
        'not-responding',
      )
      shockAt.value = null
    }
  }

  function acknowledge(id: string) {
    alerts.value = alerts.value.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    append('EVENT', { type: 'ALERT_ACKNOWLEDGED', alertId: id })
  }

  return { alerts, active, check, acknowledge }
}
