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

// Which NASA human-spaceflight risk a protocol answers (gap analysis B-1).
// 'general-*' = everyday first aid, not a space-specific risk.
export type HazardId =
  | 'hypoxia'
  | 'cardiovascular'
  | 'decompression'
  | 'sensorimotor'
  | 'spacewalk'
  | 'radiation'
  | 'general-trauma'
  | 'general-collapse'

export interface Protocol {
  id: string
  version: string
  hazardId: HazardId
  source: string // where the content comes from (demo / NASA / flight surgeon)
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

// ACTIVE: banner + sound. SILENCED: someone saw it, no sound, but the problem
// is still there. RESOLVED: the vital stayed in the safe range long enough.
export type AlertStatus = 'ACTIVE' | 'SILENCED' | 'RESOLVED'

export interface Alert {
  id: string
  key: string // which rule raised it: 'spo2', 'hr', 'fall'
  ts: number // ms since epoch (Date.now())
  level: 'WARNING' | 'CRITICAL'
  message: string
  problemId?: string
  status: AlertStatus // replaces the guide's `acknowledged: boolean`
  silencedAt?: number // when it was last silenced
  silencedValue?: number // the reading at that moment, to notice if it gets worse
  resolvedAt?: number
}

export type RecordKind = 'TRIAGE' | 'ALERT' | 'VITALS' | 'EVENT'

export interface BlackBoxRecord {
  seq: number
  ts: number // ms since epoch (Date.now())
  kind: RecordKind
  data: unknown // shape depends on kind; see BlackBoxEvent for kind 'EVENT'
  prevHash: string
  hash: string
  synced: boolean
}

// The EVENT records the app writes (data of a record with kind 'EVENT').
// Optional: type a payload with it, e.g. append('EVENT', { type: 'LINK_UP' } satisfies BlackBoxEvent)
export type BlackBoxEvent =
  | { type: 'ALERT_SILENCED'; alertId: string } // useAlerts.silence (Track C)
  | { type: 'ALERT_RESOUNDED'; alertId: string; reason: 'TIMEOUT' | 'WORSE' } // silence ended
  | { type: 'ALERT_RESOLVED'; alertId: string } // vital back in range long enough
  | { type: 'LINK_UP' } // useSync.setOnline(true) (Track D)
  | { type: 'LINK_DOWN' } // useSync.setOnline(false) (Track D)
