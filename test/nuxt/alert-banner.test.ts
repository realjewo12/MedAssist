// test/nuxt/alert-banner.test.ts   (what the crew sees for each alert level)
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AlertBanner from '~/components/ui/AlertBanner.vue'
import type { Alert } from '~/types'

const { navSpy } = vi.hoisted(() => ({ navSpy: vi.fn() }))
mockNuxtImport('navigateTo', () => navSpy)

const alert = (level: Alert['level']): Alert => ({
  id: `a-${level}`,
  key: 'spo2',
  ts: Date.now(),
  level,
  message: 'Oxygen is low (85%).',
  problemId: 'hard-to-breathe',
  status: 'ACTIVE',
})

beforeEach(() => {
  useAlerts().reset()
  navSpy.mockReset()
})

describe('AlertBanner', () => {
  it('CRITICAL: red alert with START EMERGENCY and silence', async () => {
    useAlerts().alerts.value = [alert('CRITICAL')]
    const w = await mountSuspended(AlertBanner)
    expect(w.get('[role="alert"]').text()).toContain('🚨')
    expect(w.text()).toContain('START EMERGENCY')
    expect(w.text()).toContain('silence')
  })

  it('WARNING: amber notice that can still start an emergency', async () => {
    useAlerts().alerts.value = [alert('WARNING')]
    const w = await mountSuspended(AlertBanner)
    expect(w.text()).toContain('ⓘ WATCH')
    const start = w.findAll('button').find((b) => b.text() === 'START EMERGENCY')
    expect(start).toBeDefined()
    await start!.trigger('click')
    expect(navSpy).toHaveBeenCalledWith('/emergency/person') // problem already chosen
    expect(useAlerts().alerts.value[0]?.status).toBe('SILENCED')
  })
})
