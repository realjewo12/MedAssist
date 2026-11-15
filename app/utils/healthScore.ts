// app/utils/healthScore.ts
// Gap analysis D-6: a daily score built from the hazards (alerts, sleep, radiation),
// shown part by part so the crew sees why it moved. Demo weights, not validated.
// (no comma on an 'export const' line: Nuxt's auto-import scanner misreads it)
import { SHORT_SLEEP_HOURS } from './sleep' // explicit: unit tests run without auto-imports

export const DOSE_WATCH_UGY = 500 // above this since start: small penalty (demo value)
export const DOSE_CONCERN_UGY = 1000 // above this: bigger penalty (demo value)

export interface ScoreInput {
  criticalAlerts: number // today
  warningAlerts: number // today
  sleepHours: number | null // last night; null = no data
  shortSleepStreak: boolean // several short nights in a row (C-7)
  doseUGy: number // radiation dose since start, µGy
}

export interface ScorePart {
  id: 'alerts' | 'sleep' | 'dose'
  label: string
  penalty: number // points taken off 100
  detail: string
}

function alertsPart(i: ScoreInput): ScorePart {
  const penalty = Math.min(60, i.criticalAlerts * 25 + i.warningAlerts * 10)
  const detail =
    i.criticalAlerts + i.warningAlerts === 0
      ? 'No alerts today'
      : `${i.criticalAlerts} critical and ${i.warningAlerts} warning today`
  return { id: 'alerts', label: 'Alerts', penalty, detail }
}

function sleepPart(i: ScoreInput): ScorePart {
  if (i.sleepHours === null)
    return { id: 'sleep', label: 'Sleep', penalty: 0, detail: 'No data yet' }
  const h = i.sleepHours
  let penalty = h >= 7 ? 0 : h >= SHORT_SLEEP_HOURS ? 5 : 15
  if (i.shortSleepStreak) penalty += 10
  const hours = `${h.toFixed(1)} h last night`
  const detail = i.shortSleepStreak ? `${hours}; short nights in a row` : hours
  return { id: 'sleep', label: 'Sleep', penalty, detail }
}

function dosePart(i: ScoreInput): ScorePart {
  const penalty = i.doseUGy > DOSE_CONCERN_UGY ? 20 : i.doseUGy > DOSE_WATCH_UGY ? 10 : 0
  return {
    id: 'dose',
    label: 'Radiation',
    penalty,
    detail: `${Math.round(i.doseUGy)} µGy since start`,
  }
}

/** 100 minus the penalty of each part (never below 0) */
export function healthScore(i: ScoreInput) {
  const parts = [alertsPart(i), sleepPart(i), dosePart(i)]
  const total = Math.max(0, 100 - parts.reduce((sum, p) => sum + p.penalty, 0))
  const status = total >= 80 ? 'Good' : total >= 60 ? 'Watch' : 'Concern'
  return { total, status, parts }
}
