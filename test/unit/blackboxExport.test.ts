// test/unit/blackboxExport.test.ts   (plain Vitest, no Nuxt) — gap analysis D-5
import { describe, expect, it } from 'vitest'
import { buildExport, vitalsCsv, EXPORT_SCHEMA_VERSION } from '../../app/utils/blackboxExport'
import type { BlackBoxRecord } from '../../app/types'
import pkg from '../../package.json'

const rec = (seq: number, kind: BlackBoxRecord['kind'], data: unknown): BlackBoxRecord => ({
  seq,
  ts: Date.UTC(2026, 10, 15, 10, 0, seq),
  kind,
  data,
  prevHash: 'p'.repeat(64),
  hash: `h${seq}`,
  synced: false,
})

const records = [
  rec(1, 'VITALS', { ts: 1, hr: 72, spo2: 98, rr: 14, skinTemp: 36.5, motion: 0.1 }),
  rec(2, 'ALERT', { level: 'WARNING' }),
  rec(3, 'VITALS', { ts: 2, hr: 80, spo2: 95, rr: 16, skinTemp: 36.6, motion: 0.12 }),
]

describe('buildExport', () => {
  it('adds schema version, app version and units, and keeps the records as they are', () => {
    const e = buildExport(records, new Date('2026-11-15T12:00:00Z'))
    expect(e.schemaVersion).toBe(EXPORT_SCHEMA_VERSION)
    expect(e.appVersion).toBe(pkg.version)
    expect(e.exportedAt).toBe('2026-11-15T12:00:00.000Z')
    expect(e.units).toMatchObject({ hr: 'bpm', spo2: '%', motion: 'g' })
    expect(e.records).toBe(records) // hashes kept: the chain can be verified after export
  })
})

describe('vitalsCsv', () => {
  it('has a header with units and one row per VITALS record only', () => {
    const lines = vitalsCsv(records).trimEnd().split('\n')
    expect(lines[0]).toBe('seq,time_utc,hr_bpm,spo2_percent,rr_per_min,skinTemp_C,motion_g,hash')
    expect(lines).toHaveLength(3) // header + 2 vitals (the ALERT is left out)
    expect(lines[1]).toBe('1,2026-11-15T10:00:01.000Z,72,98,14,36.5,0.1,h1')
  })
})
