// app/composables/useSync.ts
import type { BlackBoxRecord } from '~/types'

let syncing = false // module level: only one sync at a time

// lower number = sent first. Critical alerts always go first.
function priority(r: BlackBoxRecord): number {
  if (r.kind === 'ALERT' && (r.data as { level?: string }).level === 'CRITICAL') return 0
  if (r.kind === 'ALERT') return 1
  if (r.kind === 'TRIAGE') return 2
  return 3
}

export function useSync() {
  const online = useState<boolean>('sync-online', () => true)
  const lastSyncAt = useState<number | null>('sync-last', () => null)
  const lastBatch = useState<string[]>('sync-last-batch', () => [])
  const { unsynced, markSynced, append } = useBlackBox()
  const pendingCount = computed(() => unsynced.value.length)

  async function trySync() {
    if (!online.value || syncing || unsynced.value.length === 0) return
    syncing = true
    try {
      const batch = [...unsynced.value].sort((a, b) => priority(a) - priority(b) || a.seq - b.seq).slice(0, 200)
      await new Promise((resolve) => setTimeout(resolve, 800)) // pretend network delay
      if (!online.value) return // link lost during the send: try again later
      markSynced(batch.map((r) => r.seq))
      lastSyncAt.value = Date.now()
      lastBatch.value = batch.map((r) =>
        r.kind === 'ALERT' ? `ALERT (${(r.data as { level?: string }).level ?? '?'})` : r.kind,
      )
    } finally {
      syncing = false
    }
  }

  function setOnline(value: boolean) {
    online.value = value
    append('EVENT', { type: value ? 'LINK_UP' : 'LINK_DOWN' })
    if (value) setTimeout(trySync, 300)
  }

  return { online, lastSyncAt, lastBatch, pendingCount, trySync, setOnline }
}
