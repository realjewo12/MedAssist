// test/nuxt/emergency-flow.test.ts
// Order: Who needs help? → What is the problem? → questions → steps,
// and texts that speak to the person when they chose ME.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import WhoPage from '~/pages/emergency/index.vue'
import ProblemPage from '~/pages/emergency/problem.vue'
import SeverityPage from '~/pages/emergency/severity.vue'
import GuidancePage from '~/pages/emergency/guidance.vue'
import type { Alert } from '~/types'

const { navSpy } = vi.hoisted(() => ({ navSpy: vi.fn() }))
mockNuxtImport('navigateTo', () => navSpy)

const click = async (w: Awaited<ReturnType<typeof mountSuspended>>, text: string) => {
  const b = w.findAll('button').find((x: { text(): string }) => x.text().includes(text))
  if (!b) throw new Error(`no button "${text}" in: ${w.text()}`)
  await b.trigger('click')
}

beforeEach(() => {
  useTriage().clear()
  useAlerts().reset()
  navSpy.mockReset()
})

describe('emergency order', () => {
  it('starts with "Who needs help?", then goes to the problem list', async () => {
    const who = await mountSuspended(WhoPage)
    expect(who.text()).toContain('Step 1 of 4')
    expect(who.text()).toContain('Who needs help?')
    await click(who, 'MY TEAMMATE')
    expect(navSpy).toHaveBeenLastCalledWith('/emergency/problem')

    const problem = await mountSuspended(ProblemPage)
    expect(problem.text()).toContain('Step 2 of 4')
    expect(problem.text()).toContain('Not responding') // possible for a teammate
    await click(problem, 'Chest pain')
    expect(navSpy).toHaveBeenLastCalledWith('/emergency/severity')
    expect(useTriage().state.value).toMatchObject({ target: 'TEAMMATE', problemId: 'chest-pain' })
  })

  it('ME hides "Not responding"', async () => {
    await click(await mountSuspended(WhoPage), 'ME')
    const problem = await mountSuspended(ProblemPage)
    expect(problem.text()).not.toContain('Not responding')
  })

  it('started from an alert: Who → straight to the questions (problem already known)', async () => {
    useTriage().start('hard-to-breathe')
    await click(await mountSuspended(WhoPage), 'MY TEAMMATE')
    expect(navSpy).toHaveBeenLastCalledWith('/emergency/severity')
  })

  it('an impact alert ("Not responding") answered with ME asks for the problem instead', async () => {
    useTriage().start('not-responding')
    await click(await mountSuspended(WhoPage), 'ME')
    expect(navSpy).toHaveBeenLastCalledWith('/emergency/problem')
    expect(useTriage().state.value.problemId).toBeFalsy()
  })

  it('opening the emergency silences every sounding alarm', async () => {
    const a = (id: string): Alert => ({
      id,
      key: id,
      ts: Date.now(),
      level: 'CRITICAL',
      message: id,
      status: 'ACTIVE',
    })
    useAlerts().alerts.value = [a('spo2'), a('rr')]
    await mountSuspended(WhoPage)
    expect(useAlerts().active.value).toHaveLength(0)
    expect(useAlerts().silenced.value).toHaveLength(2) // still watched, not forgotten
  })
})

describe('texts speak to the person who chose ME', () => {
  it('questions and steps say "you", not "they"', async () => {
    useTriage().start()
    useTriage().selectTarget('SELF')
    useTriage().selectProblem('hard-to-breathe')
    const sev = await mountSuspended(SeverityPage)
    expect(sev.text()).toContain('Can you speak in full sentences?')

    useTriage().setResult({ severity: 'LOW', score: 0, redFlag: false, reasons: [] })
    const guide = await mountSuspended(GuidancePage)
    expect(guide.text()).toContain('Sit upright and rest.')
    expect(guide.text()).not.toMatch(/\b(they|them|their)\b/)
  })

  it('a teammate still gets "they"', async () => {
    useTriage().start()
    useTriage().selectTarget('TEAMMATE')
    useTriage().selectProblem('hard-to-breathe')
    const sev = await mountSuspended(SeverityPage)
    expect(sev.text()).toContain('Can they speak in full sentences?')
  })
})
