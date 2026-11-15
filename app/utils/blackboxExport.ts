// app/utils/blackboxExport.ts
// Gap analysis D-5: an export researchers can compare across crew members,
// missions and app versions. Pure functions: easy to test.
import type { BlackBoxRecord, VitalSample } from '~/types'
import { version as appVersion } from '../../package.json'

/** Raise when the export layout changes, so old files can still be read correctly */
export const EXPORT_SCHEMA_VERSION = 1

export const VITAL_UNITS = {
  hr: 'bpm',
  spo2: '%',
  rr: 'breaths/min',
  skinTemp: '°C',
  motion: 'g',
  ts: 'ms since 1970-01-01 UTC',
}

/** The JSON export: records unchanged (hashes included, so the chain can be verified later) */
export function buildExport(records: BlackBoxRecord[], exportedAt = new Date()) {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    app: 'MedAssist',
    appVersion,
    exportedAt: exportedAt.toISOString(),
    units: VITAL_UNITS,
    hashAlgorithm: 'SHA-256 of "prevHash|seq|ts|kind|JSON(data)"',
    records,
  }
}

const CSV_COLUMNS = ['seq', 'time_utc', 'hr', 'spo2', 'rr', 'skinTemp', 'motion', 'hash'] as const

/** One row per VITALS record, with units in the header */
export function vitalsCsv(records: BlackBoxRecord[]): string {
  const header = [
    'seq',
    'time_utc',
    `hr_${VITAL_UNITS.hr}`,
    'spo2_percent',
    'rr_per_min',
    'skinTemp_C',
    `motion_${VITAL_UNITS.motion}`,
    'hash',
  ]
  const rows = records
    .filter((r) => r.kind === 'VITALS')
    .map((r) => {
      const v = r.data as VitalSample
      const row: Record<(typeof CSV_COLUMNS)[number], string | number> = {
        seq: r.seq,
        time_utc: new Date(r.ts).toISOString(),
        hr: v.hr,
        spo2: v.spo2,
        rr: v.rr,
        skinTemp: v.skinTemp,
        motion: v.motion,
        hash: r.hash,
      }
      return CSV_COLUMNS.map((c) => row[c]).join(',')
    })
  return [header.join(','), ...rows].join('\n') + '\n'
}
