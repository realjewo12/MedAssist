// app/composables/useAlerts.ts   STUB – Track C replaces it
import type { Alert } from '~/types'

export function useAlerts() {
  const alerts = useState<Alert[]>('alerts', () => [])
  const active = computed(() => alerts.value.filter((a) => !a.acknowledged))
  function acknowledge(_id: string) {}
  return { alerts, active, acknowledge }
}
