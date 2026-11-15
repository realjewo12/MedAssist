// tailwind.config.ts  (project root)
import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        // severity colours
        // - base (low/moderate/critical): filled backgrounds. Text on them: white on low &
        //   critical, space-900 on moderate.
        // - *-text: text/icons/borders on the dark space backgrounds (all ≥ 5.4:1 contrast).
        sev: {
          low: '#15803d',
          'low-text': '#4ade80',
          moderate: '#f59e0b',
          'moderate-text': '#fbbf24',
          critical: '#b91c1c',
          'critical-text': '#f87171',
        },
        // dark "space" background shades
        space: { 900: '#0b1020', 800: '#131a2e', 700: '#1c2540' },
      },
      // Sprint 3: every button at least 64 px (touch = 72 px for the main choices)
      minHeight: { touch: '4rem', tap: '64px' }, // 4rem = 72px at the 18px base font (main.css)
      // Sprint 3: step text at least 24 px, body text at least 20 px (text-lg = 20.25 px)
      fontSize: { step: ['24px', '1.3'] },
    },
  },
}
