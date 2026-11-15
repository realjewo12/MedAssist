// app/composables/useBlackBox.ts
import type { BlackBoxRecord, RecordKind } from '~/types'

const STORAGE_KEY = 'medassist-blackbox'
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const GENESIS = '0'.repeat(64) // "previous hash" of the very first record

// the exact text that is hashed for one record
function hashInput(r: Pick<BlackBoxRecord, 'prevHash' | 'seq' | 'ts' | 'kind' | 'data'>): string {
  return `${r.prevHash}|${r.seq}|${r.ts}|${r.kind}|${JSON.stringify(r.data)}`
}

function load(): BlackBoxRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as BlackBoxRecord[]
  } catch {
    return []
  }
}

function save(records: BlackBoxRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    console.error('Black box: could not save', error)
  }
}

// one write at a time, so two records never get the same number
let writeQueue: Promise<void> = Promise.resolve()

export function useBlackBox() {
  const records = useState<BlackBoxRecord[]>('blackbox', load)
  const unsynced = computed(() => records.value.filter((r) => !r.synced))

  function append(kind: RecordKind, data: unknown): Promise<void> {
    writeQueue = writeQueue
      .then(async () => {
        const last = records.value.at(-1)
        const base = {
          seq: (last?.seq ?? 0) + 1,
          ts: Date.now(),
          kind,
          data: JSON.parse(JSON.stringify(data)) as unknown, // plain copy of the data
          prevHash: last?.hash ?? GENESIS,
        }
        const hash = await sha256(hashInput(base))
        const cutoff = Date.now() - RETENTION_MS
        // keep 30 days; never delete a record that was not synced yet
        const kept = records.value.filter((r) => r.ts >= cutoff || !r.synced)
        records.value = [...kept, { ...base, hash, synced: false }]
        save(records.value)
      })
      .catch((error) => console.error('Black box: write failed', error))
    return writeQueue
  }

  async function verify(): Promise<{ ok: boolean; brokenAtSeq?: number }> {
    let previous: BlackBoxRecord | undefined
    for (const r of records.value) {
      if (previous && r.prevHash !== previous.hash) return { ok: false, brokenAtSeq: r.seq }
      if ((await sha256(hashInput(r))) !== r.hash) return { ok: false, brokenAtSeq: r.seq }
      previous = r
    }
    return { ok: true }
  }

  function markSynced(seqs: number[]) {
    const done = new Set(seqs)
    records.value = records.value.map((r) => (done.has(r.seq) ? { ...r, synced: true } : r))
    save(records.value)
  }

  function exportJson() {
    const content = JSON.stringify(
      { exportedAt: new Date().toISOString(), records: records.value },
      null,
      2,
    )
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `medassist-blackbox-${Date.now()}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000) // Safari/Firefox need the URL a moment longer
  }

  function clearAll() {
    records.value = []
    save([])
  }

  return { records, unsynced, append, verify, markSynced, exportJson, clearAll }
}
