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

// Gap analysis D-1: browsers allow about 5 million characters of localStorage
// per site; 30 days of one-per-minute VITALS records need about 13 million.
// The demo keeps localStorage and SAYS when saving fails; the full 30 days
// needs IndexedDB (planned).
export const STORAGE_LIMIT_CHARS = 5_000_000

/** Characters this site keeps in localStorage (all keys), i.e. what counts against the limit */
function storageUsed(): number {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? ''
      total += key.length + (localStorage.getItem(key)?.length ?? 0)
    }
    return total
  } catch {
    return 0
  }
}

/** Saves all records. Returns ok, or why it failed. */
function save(records: BlackBoxRecord[]): { ok: true } | { error: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return { ok: true }
  } catch (error) {
    console.error('Black box: could not save', error)
    const full = error instanceof DOMException && error.name === 'QuotaExceededError'
    return { error: full ? 'storage is full' : 'storage is not available' }
  }
}

// one write at a time, so two records never get the same number
let writeQueue: Promise<void> = Promise.resolve()

export function useBlackBox() {
  const records = useState<BlackBoxRecord[]>('blackbox', load)
  const unsynced = computed(() => records.value.filter((r) => !r.synced))
  // null = saved fine. Otherwise: why saving failed and since when.
  const saveError = useState<{ reason: string; since: number } | null>(
    'blackbox-save-error',
    () => null,
  )
  const savedChars = useState<number>('blackbox-saved-chars', storageUsed)

  // Records always stay in memory (and still sync to the base) even when the
  // device cannot save them; the error is shown, never only logged.
  function persist() {
    const result = save(records.value)
    savedChars.value = storageUsed()
    if ('ok' in result) {
      saveError.value = null
    } else if (!saveError.value) {
      saveError.value = { reason: result.error, since: Date.now() }
    }
  }

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
        persist()
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
    persist()
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
    persist()
  }

  return {
    records,
    unsynced,
    saveError,
    savedChars,
    append,
    verify,
    markSynced,
    exportJson,
    clearAll,
  }
}
