// test/nuxt/pages-render.test.ts
// Catches components that do not resolve (Nuxt names them after their folder:
// components/vitals/EnvTile.vue is <VitalsEnvTile>). Typecheck does not catch this.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HomePage from '~/pages/index.vue'
import VitalsPage from '~/pages/vitals.vue'
import BlackboxPage from '~/pages/blackbox.vue'
import DemoPage from '~/pages/demo.vue'
import EmergencyIndex from '~/pages/emergency/index.vue'

afterEach(() => vi.restoreAllMocks())

const pages = { HomePage, VitalsPage, BlackboxPage, DemoPage, EmergencyIndex }

describe('every page renders all its components', () => {
  for (const [name, page] of Object.entries(pages)) {
    it(name, async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await mountSuspended(page)
      const unresolved = warn.mock.calls
        .map((c) => String(c[0]))
        .filter((m) => m.includes('resolve component'))
      expect(unresolved).toEqual([])
    })
  }

  it('the vitals page shows the cabin and radiation tiles', async () => {
    const w = await mountSuspended(VitalsPage)
    expect(w.text()).toContain('Cabin CO2')
    expect(w.text()).toContain('Radiation dose rate')
  })
})
