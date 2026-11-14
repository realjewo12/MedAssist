// app/composables/useBlackBox.ts   STUB – Track D replaces it
import type { BlackBoxRecord, RecordKind } from '~/types'

export function useBlackBox() {
  const records = useState<BlackBoxRecord[]>('blackbox', () => [])
  const unsynced = computed(() => records.value.filter((r) => !r.synced))
  async function append(kind: RecordKind, data: unknown) {
    console.info('[black box stub]', kind, data)
  }
  return { records, unsynced, append }
}
