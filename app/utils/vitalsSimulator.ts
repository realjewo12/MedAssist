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

  // Gap analysis C-4: a suit problem during a spacewalk. Oxygen falls more
  // slowly than 'hypoxia' (WARNING first, CRITICAL later) while breathing
  // and heart rate climb. The page also marks "spacewalk just ended".
  if (scenario === 'eva-suit') {
    spo2 = Math.max(85, 97 - seconds * 0.3) // below 94 % after ~10 s, below 90 % after ~23 s
    rr = 14 + Math.min(14, seconds / 2) // fast breathing: WARNING above 24 after ~20 s
    hr = 80 + Math.min(30, seconds / 2)
    motion = 0.3 // working in the suit
  }

  // Gap analysis C-4: fainting during a gravity change. The heart races,
  // the person collapses (short impact), then lies still with a slow pulse.
  if (scenario === 'faint') {
    if (seconds < 8) {
      hr = 72 + seconds * 9 // up to about 140 bpm
    } else {
      hr = seconds < 12 ? 48 : 56 // slow pulse after the faint
      motion = seconds < 9 ? 4.5 : 0 // a 4.5 g impact, then no movement
    }
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
