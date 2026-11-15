// test/nuxt/alert-banner.test.ts   (what the crew sees: ONE compact banner, never a pile)
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AlertBanner from '~/components/ui/AlertBanner.vue'
import type { Alert } from '~/types'

const { navSpy } = vi.hoisted(() => ({ navSpy: vi.fn() }))
mockNuxtImport('navigateTo', () => navSpy)

const alert = (
  id: string,
  level: Alert['level'],
  status: Alert['status'] = 'ACTIVE',
  problemId = 'hard-to-breathe',
): Alert => ({
  id,
  key: id,
  ts: Date.now(),
  level,
  message: `${level} ${id}`,
  problemId,
  status,
})

beforeEach(() => {
  useAlerts().reset()
  useTriage().clear()
  navSpy.mockReset()
})

describe('AlertBanner', () => {
  it('shows ONE banner for three open alerts: the most urgent, plus "+2 more"', async () => {
    useAlerts().alerts.value = [
      alert('rr', 'WARNING'),
      alert('hr', 'CRITICAL', 'SILENCED'),
      alert('spo2', 'CRITICAL'),
    ]
    const w = await mountSuspended(AlertBanner)
    expect(w.findAll('p')).toHaveLength(1)
    expect(w.text()).toMatch(/🚨 ALERT:\s+CRITICAL spo2/) // colour + icon + word; sounding critical first
    expect(w.text()).toContain('+2 more')
  })

  it('a WARNING can still start an emergency, which begins with "Who needs help?"', async () => {
    useAlerts().alerts.value = [alert('spo2', 'WARNING')]
    const w = await mountSuspended(AlertBanner)
    expect(w.text()).toContain('ⓘ WATCH')
    await w
      .findAll('button')
      .find((b) => b.text() === 'START EMERGENCY')!
      .trigger('click')
    expect(navSpy).toHaveBeenCalledWith('/emergency')
    expect(useTriage().state.value.problemId).toBe('hard-to-breathe') // already known
  })

  it('a radiation alert goes straight to the questions, for the whole crew', async () => {
    useAlerts().alerts.value = [alert('radiation', 'CRITICAL', 'ACTIVE', 'radiation-alert')]
    const w = await mountSuspended(AlertBanner)
    await w
      .findAll('button')
      .find((b) => b.text() === 'START EMERGENCY')!
      .trigger('click')
    expect(navSpy).toHaveBeenCalledWith('/emergency/severity')
    expect(useTriage().state.value.target).toBe('CREW')
  })

  it('nothing is shown when there is no open alert', async () => {
    const w = await mountSuspended(AlertBanner)
    expect(w.text()).toBe('')
  })
})
