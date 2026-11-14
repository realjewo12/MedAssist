// app/types/index.ts
export type Severity = 'LOW' | 'MODERATE' | 'CRITICAL'
export type Target = 'SELF' | 'TEAMMATE'
export type Scenario = 'normal' | 'hypoxia' | 'fall'

export interface Problem {
  id: string
  label: string
  icon: string
}

export interface Answer {
  id: string
  label: string
  score: number
  redFlag?: boolean
}

export interface Question {
  id: string
  text: string
  answers: Answer[]
}

export interface ProtocolStep {
  text: string
  timerSeconds?: number
}

export interface Protocol {
  id: string
  version: string
  questions: Question[]
  thresholds: { moderate: number; critical: number }
  summary: Record<Severity, string>
  steps: Record<Severity, ProtocolStep[]>
  callBaseWhen: string
}

// All `ts` fields: milliseconds since the Unix epoch, as returned by Date.now().

export interface VitalSample {
  ts: number // ms since epoch (Date.now())
  hr: number // heart rate, beats per minute
  spo2: number // blood oxygen, %
  rr: number // breaths per minute
  skinTemp: number // °C
  motion: number // movement in g
}

export interface TriageInput {
  answerIds: string[]
  vitals?: VitalSample
}

export interface TriageResult {
  severity: Severity
  score: number
  redFlag: boolean
  reasons: string[]
}

// Same names as Severity, so one lookup (colours, labels) works for both.
// LOW is excluded: a low-severity finding never raises an alert.
export type AlertLevel = Exclude<Severity, 'LOW'>

export interface Alert {
  id: string
  key: string // which rule raised it: 'spo2', 'hr', 'fall'
  ts: number // ms since epoch (Date.now())
  level: AlertLevel
  message: string
  problemId?: string
  acknowledged: boolean
}

// Each record kind carries its own payload type, so after checking `kind`
// TypeScript knows the shape of `data` (e.g. kind 'VITALS' → data is a VitalSample).
export type BlackBoxPayload =
  | { kind: 'TRIAGE'; data: TriageResult }
  | { kind: 'ALERT'; data: Alert }
  | { kind: 'VITALS'; data: VitalSample }
  | { kind: 'EVENT'; data: BlackBoxEvent }

// Free-form event (e.g. 'base_called', 'protocol_started'). Refine as events are defined.
export interface BlackBoxEvent {
  type: string
  note?: string
}

export type RecordKind = BlackBoxPayload['kind']

export type BlackBoxRecord = BlackBoxPayload & {
  seq: number
  ts: number // ms since epoch (Date.now())
  prevHash: string
  hash: string
  synced: boolean
}
