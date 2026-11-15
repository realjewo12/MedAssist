// app/utils/vitalsSimulator.ts
import type { Scenario, VitalSample } from '~/types'

// random number between -amp/2 and +amp/2, to make values look alive
const noise = (amp: number) => (Math.random() - 0.5) * amp

/**
 * @param scenario  which situation to simulate
 * @param seconds   seconds since the scenario started
 */
export function simulateVitals(scenario: Scenario, seconds: number): VitalSample {
  let hr = 72
  let spo2 = 98
  let rr = 14
  let motion = 0.1 // normal small movements

  if (scenario === 'hypoxia') {
    spo2 = Math.max(84, 98 - seconds * 0.4) // below 90% after about 20 s
    hr = 72 + Math.min(40, seconds) // heart speeds up
    rr = 14 + Math.min(12, seconds / 3) // breathing speeds up
  }

  if (scenario === 'fall') {
    motion = seconds < 2 ? 6 : 0 // a 6 g shock, then no movement at all
  }

  return {
    ts: Date.now(),
    hr: Math.round(hr + noise(4)),
    spo2: Math.min(100, Math.round(spo2 + noise(1))),
    rr: Math.round(rr + noise(2)),
    skinTemp: Math.round((36.5 + noise(0.2)) * 10) / 10,
    motion: Math.round((motion + Math.abs(noise(0.04))) * 100) / 100,
  }
}
